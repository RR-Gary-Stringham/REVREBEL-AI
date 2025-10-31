#!/usr/bin/env python3
"""
Zilliz Upload Pipeline
Upload embedded JSON files from Complete folder to Zilliz Cloud and move to Uploaded folder.
"""

import json
import os
import shutil
import sys
from pathlib import Path
from typing import List, Dict, Any
from pymilvus import connections, Collection
import time


class ZillizUploader:
    """Upload embedded JSON files to Zilliz Cloud."""

    def __init__(
        self,
        complete_folder: str = "Complete",
        uploaded_folder: str = "Uploaded",
        zilliz_uri: str = None,
        zilliz_token: str = None,
        collection_name: str = "revrebel_collection",
        batch_size: int = 100
    ):
        """
        Initialize the Zilliz uploader.

        Args:
            complete_folder: Input folder containing embedded JSON files
            uploaded_folder: Output folder for successfully uploaded files
            zilliz_uri: Zilliz Cloud URI
            zilliz_token: Zilliz Cloud API token
            collection_name: Name of the Zilliz collection
            batch_size: Number of entries to upload per batch
        """
        self.complete_folder = Path(complete_folder)
        self.uploaded_folder = Path(uploaded_folder)
        self.zilliz_uri = zilliz_uri or os.getenv('ZILLIZ_CLOUD_URI')
        self.zilliz_token = zilliz_token or os.getenv('ZILLIZ_CLOUD_TOKEN')
        self.collection_name = collection_name
        self.batch_size = batch_size

        # Validate credentials
        if not self.zilliz_uri or not self.zilliz_token:
            raise ValueError(
                "Zilliz credentials not found. Set ZILLIZ_CLOUD_URI and "
                "ZILLIZ_CLOUD_TOKEN environment variables or pass them as arguments."
            )

        # Create folders if they don't exist
        self.complete_folder.mkdir(exist_ok=True)
        self.uploaded_folder.mkdir(exist_ok=True)

        self.collection = None
        self.connected = False

    def connect(self) -> None:
        """Establish connection to Zilliz Cloud."""
        try:
            connections.connect(
                alias="default",
                uri=self.zilliz_uri,
                token=self.zilliz_token
            )
            self.connected = True
            print(f"✅ Connected to Zilliz Cloud")
        except Exception as e:
            print(f"❌ Failed to connect to Zilliz Cloud: {e}")
            raise

    def load_collection(self) -> None:
        """Load the Zilliz collection."""
        try:
            self.collection = Collection(self.collection_name)
            self.collection.load()
            print(f"✅ Loaded collection: {self.collection_name}")
            print(f"   Current entity count: {self.collection.num_entities}")
        except Exception as e:
            print(f"❌ Failed to load collection '{self.collection_name}': {e}")
            print(f"   Make sure the collection exists in Zilliz Cloud")
            raise

    def prepare_entry(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Prepare a single entry for Zilliz insertion.
        Override this method to customize data transformation.

        Args:
            data: JSON data with embedding

        Returns:
            Prepared entry for Zilliz
        """
        # Default behavior: use the data as-is
        # The embedding should already be in the '_embedding' field
        entry = data.copy()

        # Rename _embedding to vector if needed
        if '_embedding' in entry:
            entry['vector'] = entry.pop('_embedding')

        # Remove metadata fields that aren't part of your schema
        entry.pop('_embedding_model', None)
        entry.pop('_source_file', None)

        return entry

    def prepare_batch(self, entries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Prepare a batch of entries for insertion.

        Args:
            entries: List of JSON data with embeddings

        Returns:
            List of prepared entries
        """
        return [self.prepare_entry(entry) for entry in entries]

    def upload_batch(self, batch: List[Dict[str, Any]]) -> bool:
        """
        Upload a batch of entries to Zilliz.

        Args:
            batch: List of prepared entries

        Returns:
            True if successful, False otherwise
        """
        try:
            self.collection.insert(batch)
            return True
        except Exception as e:
            print(f"   ❌ Error uploading batch: {e}")
            return False

    def upload_file(self, json_file: Path) -> bool:
        """
        Upload a single JSON file to Zilliz.

        Args:
            json_file: Path to the JSON file

        Returns:
            True if successful, False otherwise
        """
        print(f"\n📤 Uploading: {json_file.name}")

        try:
            # Read JSON file
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)

            # Handle both single object and array of objects
            if isinstance(data, dict):
                entries = [data]
            elif isinstance(data, list):
                entries = data
            else:
                print(f"   ⚠️  Unexpected data format, skipping")
                return False

            # Check for embeddings
            if not entries:
                print(f"   ⚠️  Empty file, skipping")
                return False

            first_entry = entries[0]
            if '_embedding' not in first_entry and 'vector' not in first_entry:
                print(f"   ⚠️  No embedding found, skipping")
                print(f"   Make sure to run process_embeddings.py first")
                return False

            print(f"   Found {len(entries)} entry/entries")

            # Prepare entries
            prepared_entries = self.prepare_batch(entries)

            # Upload in batches
            total_uploaded = 0
            for i in range(0, len(prepared_entries), self.batch_size):
                batch = prepared_entries[i:i + self.batch_size]
                if self.upload_batch(batch):
                    total_uploaded += len(batch)
                    print(f"   ✅ Uploaded batch {i // self.batch_size + 1}: {len(batch)} entries")
                else:
                    print(f"   ❌ Failed to upload batch {i // self.batch_size + 1}")
                    return False

                # Small delay between batches
                if i + self.batch_size < len(prepared_entries):
                    time.sleep(0.1)

            # Flush to persist
            self.collection.flush()
            print(f"   ✅ Successfully uploaded {total_uploaded} entries")

            return True

        except json.JSONDecodeError as e:
            print(f"   ❌ Invalid JSON: {e}")
            return False
        except Exception as e:
            print(f"   ❌ Error processing file: {e}")
            return False

    def move_to_uploaded(self, json_file: Path) -> None:
        """
        Move a successfully uploaded file to the Uploaded folder.

        Args:
            json_file: Path to the file to move
        """
        try:
            destination = self.uploaded_folder / json_file.name
            shutil.move(str(json_file), str(destination))
            print(f"   📁 Moved to: {destination}")
        except Exception as e:
            print(f"   ⚠️  Warning: Could not move file: {e}")

    def process_all_files(self) -> None:
        """Process all JSON files in the Complete folder."""
        json_files = list(self.complete_folder.glob("*.json"))

        if not json_files:
            print(f"No JSON files found in '{self.complete_folder}' folder")
            return

        print(f"\n{'='*80}")
        print(f"ZILLIZ UPLOAD PIPELINE")
        print(f"{'='*80}")
        print(f"Found {len(json_files)} JSON file(s) to upload\n")

        # Connect to Zilliz
        self.connect()
        self.load_collection()

        initial_count = self.collection.num_entities

        # Process each file
        success_count = 0
        fail_count = 0

        for json_file in json_files:
            if self.upload_file(json_file):
                self.move_to_uploaded(json_file)
                success_count += 1
            else:
                fail_count += 1

        # Final summary
        print(f"\n{'='*80}")
        print(f"UPLOAD COMPLETE")
        print(f"{'='*80}")
        print(f"✅ Successfully uploaded: {success_count} file(s)")
        if fail_count > 0:
            print(f"❌ Failed: {fail_count} file(s)")

        # Verify final count
        final_count = self.collection.num_entities
        print(f"\n📊 Collection Statistics:")
        print(f"   Initial entities: {initial_count}")
        print(f"   Final entities: {final_count}")
        print(f"   New entities added: {final_count - initial_count}")

        if fail_count > 0:
            print(f"\n⚠️  Some files failed to upload. Check error messages above.")
        else:
            print(f"\n🎉 All files uploaded successfully!")

    def disconnect(self) -> None:
        """Disconnect from Zilliz Cloud."""
        if self.connected:
            connections.disconnect("default")
            print("Disconnected from Zilliz Cloud")


def main():
    """Main entry point for the script."""

    # Check for Zilliz credentials
    zilliz_uri = os.getenv('ZILLIZ_CLOUD_URI')
    zilliz_token = os.getenv('ZILLIZ_CLOUD_TOKEN')

    if not zilliz_uri or not zilliz_token:
        print("❌ Error: Zilliz Cloud credentials not set")
        print("Set them with:")
        print("  export ZILLIZ_CLOUD_URI='your-zilliz-uri'")
        print("  export ZILLIZ_CLOUD_TOKEN='your-zilliz-token'")
        sys.exit(1)

    # Get collection name from environment or use default
    collection_name = os.getenv('ZILLIZ_COLLECTION_NAME', 'revrebel_collection')

    # Create uploader instance
    uploader = ZillizUploader(
        complete_folder="Complete",
        uploaded_folder="Uploaded",
        zilliz_uri=zilliz_uri,
        zilliz_token=zilliz_token,
        collection_name=collection_name,
        batch_size=100
    )

    try:
        # Process all files
        uploader.process_all_files()
    except KeyboardInterrupt:
        print("\n\n⚠️  Upload interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        sys.exit(1)
    finally:
        # Always disconnect
        uploader.disconnect()


if __name__ == "__main__":
    main()
