#!/usr/bin/env python3
"""
JSON Embedding Pipeline
Process JSON files from the Ready folder, add OpenAI embeddings, and save to Complete folder.
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, Any, List
from openai import OpenAI
from dotenv import load_dotenv


class EmbeddingProcessor:
    """Process JSON files and add OpenAI embeddings."""

    def __init__(
        self,
        ready_folder: str = "Ready",
        complete_folder: str = "Complete",
        embedding_model: str = "text-embedding-3-small"
    ):
        """
        Initialize the embedding processor.

        Args:
            ready_folder: Input folder containing JSON files
            complete_folder: Output folder for processed files
            embedding_model: OpenAI embedding model to use
        """
        self.ready_folder = Path(ready_folder)
        self.complete_folder = Path(complete_folder)
        self.embedding_model = embedding_model

        # Initialize OpenAI client (expects OPENAI_API_KEY env variable)
        self.client = OpenAI()

        # Create folders if they don't exist
        self.ready_folder.mkdir(exist_ok=True)
        self.complete_folder.mkdir(exist_ok=True)

    def get_embedding(self, text: str) -> List[float]:
        """
        Get embedding for a text string using OpenAI API.

        Args:
            text: Text to embed

        Returns:
            List of floats representing the embedding vector
        """
        try:
            response = self.client.embeddings.create(
                input=text,
                model=self.embedding_model
            )
            return response.data[0].embedding
        except Exception as e:
            print(f"Error getting embedding: {e}")
            raise

    def extract_text_from_json(self, data: Dict[str, Any]) -> str:
        """
        Extract text content from JSON for embedding.
        Override this method to customize text extraction.

        Args:
            data: JSON data as dictionary

        Returns:
            Text string to embed
        """
        # Default behavior: concatenate all string values
        text_parts = []

        def extract_strings(obj):
            if isinstance(obj, str):
                text_parts.append(obj)
            elif isinstance(obj, dict):
                for value in obj.values():
                    extract_strings(value)
            elif isinstance(obj, list):
                for item in obj:
                    extract_strings(item)

        extract_strings(data)
        return " ".join(text_parts)

    def process_file(self, json_file: Path) -> None:
        """
        Process a single JSON file: add embeddings and save to Complete folder.

        Args:
            json_file: Path to the JSON file to process
        """
        print(f"Processing: {json_file.name}")

        try:
            # Read JSON file
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)

            # Extract text for embedding
            text = self.extract_text_from_json(data)

            if not text.strip():
                print(f"Warning: No text found in {json_file.name}, skipping embedding")
                embedding = []
            else:
                # Get embedding
                embedding = self.get_embedding(text)
                print(f"  Generated embedding (dimension: {len(embedding)})")

            # Add embedding to data
            data['vector'] = embedding
            data['_embedding_model'] = self.embedding_model
            data['_source_file'] = json_file.name

            # Save to Complete folder
            output_file = self.complete_folder / json_file.name
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)

            print(f"  Saved to: {output_file}")

            # Optionally remove from Ready folder after successful processing
            # json_file.unlink()  # Uncomment to delete original file

        except json.JSONDecodeError as e:
            print(f"Error: Invalid JSON in {json_file.name}: {e}")
        except Exception as e:
            print(f"Error processing {json_file.name}: {e}")

    def process_all_files(self) -> None:
        """Process all JSON files in the Ready folder."""
        json_files = list(self.ready_folder.glob("*.json"))

        if not json_files:
            print(f"No JSON files found in '{self.ready_folder}' folder")
            return

        print(f"Found {len(json_files)} JSON file(s) to process\n")

        for json_file in json_files:
            self.process_file(json_file)
            print()  # Empty line between files

        print(f"Processing complete! Check the '{self.complete_folder}' folder for results.")


def main():
    """Main entry point for the script."""
    # Load environment variables from .env file
    load_dotenv()

    # Check for OpenAI API key
    if not os.getenv('OPENAI_API_KEY'):
        print("Error: OPENAI_API_KEY environment variable not set")
        print("Set it with: export OPENAI_API_KEY='your-api-key-here'")
        sys.exit(1)

    # You can customize these settings
    processor = EmbeddingProcessor(
        ready_folder="Ready",
        complete_folder="Complete",
        embedding_model="text-embedding-3-small"  # or "text-embedding-3-large"
    )

    processor.process_all_files()


if __name__ == "__main__":
    main()
