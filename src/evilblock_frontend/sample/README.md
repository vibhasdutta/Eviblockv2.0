# Q&A API Test Files

This directory contains sample files for testing the Q&A generation API.

## Files

- **1.pdf** - Sample PDF document for testing question generation

## Usage

### Test with Node.js Script

From the `evilblock_frontend` directory:

```bash
# Install form-data if not already installed
npm install form-data

# Test with default sample file (1.pdf) and 5 questions
node test-qa-api.js

# Test with custom file and number of questions
node test-qa-api.js ./sample/your-file.pdf 10

# Test with different API URL
NEXT_PUBLIC_QA_API_URL=http://your-api:9000 node test-qa-api.js
```

### Test with cURL

```bash
# Basic test
curl -X POST http://localhost:9000/generate-questions \
  -F "file=@./sample/1.pdf" \
  -F "num_questions=5"

# With custom parameters
curl -X POST http://localhost:9000/generate-questions \
  -F "file=@./sample/1.pdf" \
  -F "num_questions=10" \
  -F "languages=eng"
```

### Expected API Response

```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "q": "What is the roll number mentioned in the mark sheet?",
        "a": "2239857",
        "type": "qa"
      },
      {
        "q": "The mark sheet was declared on 06/05/2019.",
        "a": "True",
        "type": "true_false",
        "correct_answer": true
      }
    ]
  }
}
```

**Question Types:**
- **`qa`**: Text-based question with open-ended answer
- **`true_false`**: Boolean question with True/False answer and `correct_answer` field

### Error Response

```json
{
  "success": false,
  "error": "File type not allowed. Allowed types: pdf, png, jpg, jpeg, gif, bmp, tiff"
}
```

## Adding More Test Files

You can add more sample PDF or image files to this directory:

```bash
# Add your PDF
cp /path/to/your/document.pdf ./sample/

# Test with your file
node test-qa-api.js ./sample/document.pdf 5
```

## Supported File Types

- PDF (.pdf)
- Images: PNG, JPG, JPEG, GIF, BMP, TIFF

## API Configuration

The Q&A API URL is configured in `.env.local`:

```env
NEXT_PUBLIC_QA_API_URL=http://localhost:9000
```

Make sure the Q&A API server is running before testing!

## Troubleshooting

**Connection Refused Error**
```
Error: connect ECONNREFUSED 127.0.0.1:9000
```
→ Start the Q&A API server on port 9000

**File Too Large**
```
Error: Request Entity Too Large
```
→ Check API server's file size limit

**Invalid File Type**
```
Error: File type not allowed
```
→ Use supported file types (PDF, PNG, JPG, etc.)

## Integration with Frontend

The generated questions are used in the Legal document flow:

1. User uploads PDF → IPFS
2. Q&A API called in background (async)
3. Questions generated from document content
4. User completes video verification
5. Questions page displays AI-generated questions
6. User answers questions before final blockchain upload
