const fs = require('fs');
const OpenAI = require('openai');
const Papa = require('papaparse');
const embeddingsPath = "./winter_olympics_2022.csv";

async function processCSV() {
    try {
        const csvData = fs.readFileSync(embeddingsPath, 'utf8');
    
        // Parse the CSV data
        const parsed = Papa.parse(csvData, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
        });
    
        // Convert string embeddings to arrays
        parsed.data.forEach(row => {
            if (typeof row.embedding === 'string') {
                row.embedding = JSON.parse(row.embedding.replace(/'/g, '"')); // Replace single quotes with double quotes for JSON parsing
            }
        });
        
        console.log(parsed.data);
    } catch (err) {
        console.error("Error processing the CSV:", err);
    }
}

processCSV();
