#!/usr/bin/env node

/**
 * Q&A API Test Script
 * 
 * This script tests the Q&A generation API by uploading a sample PDF
 * and displaying the generated questions and answers.
 * 
 * Usage:
 *   node test-qa-api.js [pdf-file-path] [num-questions]
 * 
 * Example:
 *   node test-qa-api.js ./sample/1.pdf 5
 */

const fs = require('fs');
const path = require('path');

// Configuration
const QA_API_URL = 'https://aaa94bec5df6.ngrok-free.app';
const DEFAULT_PDF_PATH = '/home/ghostnodexubuntu/evilblock/src/evilblock_frontend/sample/1.pdf';
const DEFAULT_NUM_QUESTIONS = 5;

// ANSI color codes for better output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

async function testQAApi(pdfPath, numQuestions) {
    try {
        // Check if file exists
        if (!fs.existsSync(pdfPath)) {
            log(`❌ Error: File not found at ${pdfPath}`, colors.red);
            process.exit(1);
        }

        log('\n========================================', colors.cyan);
        log('  Q&A API Test Script', colors.bright);
        log('========================================\n', colors.cyan);

        log(`📄 PDF File: ${pdfPath}`, colors.blue);
        log(`🔢 Questions to Generate: ${numQuestions}`, colors.blue);
        log(`🌐 API URL: ${QA_API_URL}`, colors.blue);
        log('');

        // Read the PDF file
        const fileName = path.basename(pdfPath);

        // Create FormData with proper file handling
        const FormData = require('form-data');
        const formData = new FormData();

        // Append file as a stream (better for large files)
        formData.append('file', fs.createReadStream(pdfPath), {
            filename: fileName,
            contentType: 'application/pdf',
        });
        formData.append('num_questions', numQuestions.toString());

        // Make API request using node-fetch (compatible with form-data)
        log('🚀 Sending request to Q&A API...', colors.yellow);
        const startTime = Date.now();

        // Use dynamic import for node-fetch if available, or require
        let fetch;
        try {
            fetch = (await import('node-fetch')).default;
        } catch {
            // Fallback to global fetch (Node 18+)
            fetch = globalThis.fetch;
            if (!fetch) {
                log('\n⚠️  Installing node-fetch...', colors.yellow);
                require('child_process').execSync('npm install node-fetch@2', { stdio: 'inherit' });
                fetch = require('node-fetch');
            }
        }

        const response = await fetch(`${QA_API_URL}/generate-questions`, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders(),
        });

        const responseTime = Date.now() - startTime;

        if (!response.ok) {
            const errorText = await response.text();
            log(`\n❌ API Error (${response.status}):`, colors.red);
            log(errorText, colors.red);
            process.exit(1);
        }

        const result = await response.json();

        // Display results
        log(`\n✅ Response received in ${responseTime}ms\n`, colors.green);

        log('========================================', colors.cyan);
        log('  API Response', colors.bright);
        log('========================================\n', colors.cyan);

        log(JSON.stringify(result, null, 2), colors.reset);

        if (result.success && result.data && result.data.questions) {
            log('\n========================================', colors.cyan);
            log('  Generated Questions', colors.bright);
            log('========================================\n', colors.cyan);

            result.data.questions.forEach((qa, index) => {
                log(`\n${colors.bright}Question ${index + 1}:${colors.reset} [${qa.type.toUpperCase()}]`, colors.green);
                log(`  Q: ${qa.q}`, colors.blue);
                log(`  A: ${qa.a}`, colors.yellow);

                if (qa.type === 'true_false') {
                    log(`  Correct Answer: ${qa.correct_answer ? 'True' : 'False'}`, colors.cyan);
                }
            });

            log(`\n\n✅ Successfully generated ${result.data.questions.length} questions!`, colors.green);

            // Show question type breakdown
            const qaCount = result.data.questions.filter(q => q.type === 'qa').length;
            const tfCount = result.data.questions.filter(q => q.type === 'true_false').length;
            log(`   📝 Q&A Questions: ${qaCount}`, colors.blue);
            log(`   ✓ True/False Questions: ${tfCount}`, colors.yellow);
        } else {
            log('\n⚠️  No questions in response', colors.yellow);
        }

        log('\n========================================\n', colors.cyan);

    } catch (error) {
        log(`\n❌ Error: ${error.message}`, colors.red);
        if (error.code === 'ECONNREFUSED') {
            log('\n💡 Tip: Make sure the Q&A API server is running!', colors.yellow);
            log(`   Check: ${QA_API_URL}`, colors.yellow);
        }
        process.exit(1);
    }
}

// Parse command line arguments
const pdfPath = process.argv[2] || DEFAULT_PDF_PATH;
const numQuestions = parseInt(process.argv[3]) || DEFAULT_NUM_QUESTIONS;

// Run the test
testQAApi(pdfPath, numQuestions);
