# JSON Embedding Pipeline

A reusable Python script that processes JSON files by adding OpenAI embeddings.

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set your OpenAI API key:**
   ```bash
   export OPENAI_API_KEY='your-api-key-here'
   ```

## Usage

1. **Place JSON files** in the `Ready` folder

2. **Run the script:**
   ```bash
   python process_embeddings.py
   ```

3. **Find processed files** in the `Complete` folder with embeddings added

## How It Works

- Reads all `.json` files from the `Ready` folder
- Extracts text content from each JSON file
- Generates embeddings using OpenAI's API (default: `text-embedding-3-small`)
- Adds three new fields to the JSON:
  - `_embedding`: Array of embedding values
  - `_embedding_model`: Name of the model used
  - `_source_file`: Original filename
- Saves the complete file to the `Complete` folder

## Customization

### Change the embedding model

Edit `process_embeddings.py` and modify the `embedding_model` parameter:

```python
processor = EmbeddingProcessor(
    ready_folder="Ready",
    complete_folder="Complete",
    embedding_model="text-embedding-3-large"  # Use larger model
)
```

### Customize text extraction

Override the `extract_text_from_json()` method to control which fields get embedded:

```python
def extract_text_from_json(self, data: Dict[str, Any]) -> str:
    # Example: Only embed specific fields
    return f"{data.get('title', '')} {data.get('description', '')}"
```

### Auto-delete processed files

Uncomment the line in `process_file()` to delete files from Ready after processing:

```python
json_file.unlink()  # Uncomment to delete original file
```

## Example

**Input** (`Ready/example.json`):
```json
{
  "title": "Sample Document",
  "content": "This is a test document",
  "metadata": {
    "author": "John Doe"
  }
}
```

**Output** (`Complete/example.json`):
```json
{
  "title": "Sample Document",
  "content": "This is a test document",
  "metadata": {
    "author": "John Doe"
  },
  "_embedding": [0.123, -0.456, 0.789, ...],
  "_embedding_model": "text-embedding-3-small",
  "_source_file": "example.json"
}
```

## Embedding Models

- `text-embedding-3-small`: Faster, lower cost (1536 dimensions)
- `text-embedding-3-large`: Higher quality (3072 dimensions)

## Error Handling

- Invalid JSON files are skipped with an error message
- Empty files (no text content) are processed with an empty embedding array
- Original files remain in the Ready folder unless auto-delete is enabled
