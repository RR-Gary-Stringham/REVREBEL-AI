# Zilliz Upload Pipeline

A Python script that uploads embedded JSON files from the Complete folder to Zilliz Cloud and moves them to the Uploaded folder.

## Prerequisites

1. **Completed embeddings** - Files in the Complete folder must have embeddings (run `process_embeddings.py` first)
2. **Zilliz Cloud account** with a collection already created
3. **Python dependencies** installed

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set your Zilliz Cloud credentials:**
   ```bash
   export ZILLIZ_CLOUD_URI='your-zilliz-uri'
   export ZILLIZ_CLOUD_TOKEN='your-zilliz-token'
   export ZILLIZ_COLLECTION_NAME='your-collection-name'  # Optional, defaults to 'revrebel_collection'
   ```

## Usage

1. **Ensure JSON files with embeddings** are in the `Complete` folder

2. **Run the upload script:**
   ```bash
   python upload_to_zilliz.py
   ```

3. **Successfully uploaded files** will be moved to the `Uploaded` folder

## How It Works

1. Reads all `.json` files from the `Complete` folder
2. Validates that each file has embeddings (looks for `_embedding` or `vector` field)
3. Connects to Zilliz Cloud
4. Prepares entries for insertion (renames `_embedding` to `vector`, removes metadata)
5. Uploads in batches (default: 100 entries per batch)
6. Moves successfully uploaded files to the `Uploaded` folder
7. Displays statistics and summary

## Complete Workflow

Here's the full two-script workflow:

```bash
# Step 1: Generate embeddings
export OPENAI_API_KEY='your-openai-key'
python process_embeddings.py

# Step 2: Upload to Zilliz
export ZILLIZ_CLOUD_URI='your-zilliz-uri'
export ZILLIZ_CLOUD_TOKEN='your-zilliz-token'
export ZILLIZ_COLLECTION_NAME='your-collection-name'
python upload_to_zilliz.py
```

## Folder Structure

```
REVREBEL-AI/
├── Ready/          # Put raw JSON files here
├── Complete/       # Embedded JSON files (after process_embeddings.py)
├── Uploaded/       # Successfully uploaded files (after upload_to_zilliz.py)
├── process_embeddings.py
└── upload_to_zilliz.py
```

## Customization

### Custom Data Preparation

Override the `prepare_entry()` method to customize how data is transformed before upload:

```python
class CustomUploader(ZillizUploader):
    def prepare_entry(self, data: Dict[str, Any]) -> Dict[str, Any]:
        entry = super().prepare_entry(data)

        # Add custom transformations
        entry['custom_field'] = 'custom_value'

        return entry

# Use custom uploader
uploader = CustomUploader(...)
```

### Change Batch Size

Modify the `batch_size` parameter in `main()`:

```python
uploader = ZillizUploader(
    complete_folder="Complete",
    uploaded_folder="Uploaded",
    batch_size=50  # Upload 50 entries at a time
)
```

### Different Collection

Set the collection name via environment variable or parameter:

```bash
# Via environment variable
export ZILLIZ_COLLECTION_NAME='my_custom_collection'

# Or pass directly in code
uploader = ZillizUploader(
    collection_name="my_custom_collection"
)
```

## Example Output

```
================================================================================
ZILLIZ UPLOAD PIPELINE
================================================================================
Found 3 JSON file(s) to upload

✅ Connected to Zilliz Cloud
✅ Loaded collection: revrebel_collection
   Current entity count: 0

📤 Uploading: example1.json
   Found 1 entry/entries
   ✅ Uploaded batch 1: 1 entries
   ✅ Successfully uploaded 1 entries
   📁 Moved to: Uploaded/example1.json

📤 Uploading: example2.json
   Found 5 entry/entries
   ✅ Uploaded batch 1: 5 entries
   ✅ Successfully uploaded 5 entries
   📁 Moved to: Uploaded/example2.json

================================================================================
UPLOAD COMPLETE
================================================================================
✅ Successfully uploaded: 2 file(s)

📊 Collection Statistics:
   Initial entities: 0
   Final entities: 6
   New entities added: 6

🎉 All files uploaded successfully!
Disconnected from Zilliz Cloud
```

## Error Handling

The script handles various error scenarios:

- **Missing embeddings**: Files without embeddings are skipped with a warning
- **Invalid JSON**: Malformed JSON files are skipped
- **Connection errors**: Clear error messages for Zilliz connection issues
- **Collection not found**: Warns if the specified collection doesn't exist
- **Partial failures**: Failed uploads don't move files to Uploaded folder

## Troubleshooting

### "No embedding found, skipping"
- Make sure to run `process_embeddings.py` first
- Check that the Complete folder contains files with `_embedding` field

### "Failed to load collection"
- Verify your collection exists in Zilliz Cloud
- Check that the collection name is correct
- Ensure your schema matches the data structure

### "Failed to connect to Zilliz Cloud"
- Verify your ZILLIZ_CLOUD_URI and ZILLIZ_CLOUD_TOKEN are correct
- Check your internet connection
- Ensure your Zilliz Cloud account is active

## Schema Requirements

Your Zilliz collection must have:
- A `vector` field for embeddings (matches the dimension from OpenAI)
- Any other fields present in your JSON files

The script automatically:
- Renames `_embedding` → `vector`
- Removes `_embedding_model` and `_source_file` metadata

## Notes

- Original files in Complete folder are moved (not copied) to Uploaded folder after successful upload
- Failed uploads remain in the Complete folder for retry
- The script uses batch insertion for efficiency
- A small delay (0.1s) is added between batches to avoid rate limits
