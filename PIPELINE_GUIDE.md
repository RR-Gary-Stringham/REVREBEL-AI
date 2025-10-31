# JSON to Zilliz Pipeline Guide

Complete guide for processing JSON files with OpenAI embeddings and uploading to Zilliz Cloud.

## Overview

This pipeline consists of two scripts:
1. **`process_embeddings.py`** - Generates embeddings for JSON files
2. **`upload_to_zilliz.py`** - Uploads embedded files to Zilliz Cloud

## Quick Start

### 1. Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Copy and configure .env file
cp .env.example .env
# Edit .env with your API keys
```

### 2. Configure Environment Variables

Edit the `.env` file with your credentials:

```bash
# OpenAI API Configuration
OPENAI_API_KEY=your-openai-api-key-here

# Zilliz Cloud Configuration
ZILLIZ_CLOUD_URI=your-zilliz-uri-here
ZILLIZ_CLOUD_TOKEN=your-zilliz-token-here
ZILLIZ_COLLECTION_NAME=revrebel_collection
```

**Getting API Keys:**
- OpenAI: https://platform.openai.com/api-keys
- Zilliz Cloud: https://cloud.zilliz.com/

### 3. Run the Pipeline

```bash
# Step 1: Generate embeddings
python process_embeddings.py

# Step 2: Upload to Zilliz
python upload_to_zilliz.py
```

## Detailed Workflow

### Step 1: Generate Embeddings

**Script:** `process_embeddings.py`

**Input:** JSON files in the `Ready/` folder
**Output:** JSON files with embeddings in the `Complete/` folder

**What it does:**
1. Reads all `.json` files from `Ready/` folder
2. Extracts text content from each JSON file
3. Generates embeddings using OpenAI API
4. Adds three fields to each JSON:
   - `vector`: Array of embedding values
   - `_embedding_model`: Name of the model used
   - `_source_file`: Original filename
5. Saves enhanced files to `Complete/` folder

**Example:**

```bash
# Put your JSON files in Ready/
cp mydata.json Ready/

# Run embedding generation
python process_embeddings.py
```

### Step 2: Upload to Zilliz

**Script:** `upload_to_zilliz.py`

**Input:** Embedded JSON files in the `Complete/` folder
**Output:** Files moved to `Uploaded/` folder after successful upload

**What it does:**
1. Reads all `.json` files from `Complete/` folder
2. Validates that embeddings exist
3. Connects to Zilliz Cloud
4. Uploads in batches (default: 100 entries per batch)
5. Moves successfully uploaded files to `Uploaded/` folder

**Example:**

```bash
# Upload embedded files to Zilliz
python upload_to_zilliz.py
```

## Folder Structure

```
REVREBEL-AI/
├── Ready/              # Put raw JSON files here
├── Complete/           # Embedded JSON files (after process_embeddings.py)
├── Uploaded/           # Successfully uploaded files (after upload_to_zilliz.py)
├── .env                # Your API keys (create from .env.example)
├── .env.example        # Template for environment variables
├── process_embeddings.py
├── upload_to_zilliz.py
└── requirements.txt
```

## Configuration Options

### Embedding Model

Edit `process_embeddings.py` to change the embedding model:

```python
processor = EmbeddingProcessor(
    ready_folder="Ready",
    complete_folder="Complete",
    embedding_model="text-embedding-3-large"  # or "text-embedding-3-small"
)
```

**Available models:**
- `text-embedding-3-small`: 1536 dimensions, faster, lower cost
- `text-embedding-3-large`: 3072 dimensions, higher quality

### Custom Text Extraction

Override the `extract_text_from_json()` method to control which JSON fields get embedded:

```python
class CustomProcessor(EmbeddingProcessor):
    def extract_text_from_json(self, data: Dict[str, Any]) -> str:
        # Only embed specific fields
        return f"{data.get('title', '')} {data.get('description', '')}"
```

### Custom Data Preparation for Zilliz

Override the `prepare_entry()` method in `upload_to_zilliz.py`:

```python
class CustomUploader(ZillizUploader):
    def prepare_entry(self, data: Dict[str, Any]) -> Dict[str, Any]:
        entry = super().prepare_entry(data)
        # Add custom transformations
        entry['custom_field'] = 'custom_value'
        return entry
```

### Batch Size

Change the upload batch size in `upload_to_zilliz.py`:

```python
uploader = ZillizUploader(
    batch_size=50  # Upload 50 entries at a time instead of 100
)
```

## Environment Variables vs Command Line

Both scripts support two methods of configuration:

### Method 1: .env File (Recommended)

Create a `.env` file and the scripts will automatically load it:

```bash
OPENAI_API_KEY=sk-...
ZILLIZ_CLOUD_URI=https://...
ZILLIZ_CLOUD_TOKEN=...
```

### Method 2: Export Variables

```bash
export OPENAI_API_KEY='your-key'
export ZILLIZ_CLOUD_URI='your-uri'
export ZILLIZ_CLOUD_TOKEN='your-token'
```

## Example Data Flow

**Input JSON** (`Ready/example.json`):
```json
{
  "title": "Sample Document",
  "content": "This is a test",
  "metadata": {
    "author": "John"
  }
}
```

**After Embeddings** (`Complete/example.json`):
```json
{
  "title": "Sample Document",
  "content": "This is a test",
  "metadata": {
    "author": "John"
  },
  "vector": [0.123, -0.456, 0.789, ...],
  "_embedding_model": "text-embedding-3-small",
  "_source_file": "example.json"
}
```

**After Upload** (in Zilliz + `Uploaded/example.json`):
- File is uploaded to Zilliz with `vector` field
- Original file moved to `Uploaded/` folder
- Metadata fields (`_embedding_model`, `_source_file`) removed

## Troubleshooting

### "Error: OPENAI_API_KEY environment variable not set"
- Make sure you created a `.env` file from `.env.example`
- Verify your OpenAI API key is valid

### "Error: Zilliz Cloud credentials not set"
- Check that `ZILLIZ_CLOUD_URI` and `ZILLIZ_CLOUD_TOKEN` are in your `.env` file
- Verify your Zilliz Cloud credentials are correct

### "No embedding found, skipping"
- Run `process_embeddings.py` first before `upload_to_zilliz.py`
- Check that files in `Complete/` folder have the `vector` field

### "Failed to load collection"
- Verify your Zilliz collection exists
- Check that `ZILLIZ_COLLECTION_NAME` matches your collection name
- Ensure your collection schema has a `vector` field

## Performance Tips

1. **Batch Processing**: Both scripts process multiple files automatically
2. **Rate Limits**: Small delays are added between API calls to avoid rate limits
3. **Error Recovery**: Failed files remain in their folders for manual retry
4. **Parallel Processing**: For large datasets, consider splitting into multiple folders

## Advanced Usage

### Process Specific Files Only

```bash
# Move only specific files to Ready folder
mv important_doc.json Ready/
python process_embeddings.py
```

### Retry Failed Uploads

Failed uploads remain in the `Complete/` folder:

```bash
# Just run the upload script again
python upload_to_zilliz.py
```

### Auto-Delete Source Files

Uncomment this line in `process_embeddings.py` to auto-delete from Ready:

```python
json_file.unlink()  # Uncomment to delete original file
```

## Security Notes

- **Never commit `.env` files** - they contain your API keys
- Add `.env` to your `.gitignore`
- Use `.env.example` to document required variables
- Rotate API keys regularly
- Use environment-specific keys (dev/prod)

## Support

For issues or questions:
- Check the troubleshooting section above
- Review the documentation for each script:
  - `EMBEDDING_PIPELINE.md` (if exists)
  - `ZILLIZ_UPLOAD.md`
- Verify your API credentials are valid
