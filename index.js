const fs = require('fs');
const OpenAI = require('openai');
const Papa = require('papaparse');
const distance = require( 'compute-cosine-distance' );
const embeddingsPath = "./winter_olympics_2022.csv";
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function processCSV() {
    try {
        const csvData = fs.readFileSync(embeddingsPath, 'utf8');

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

        return parsed.data;

    } catch (err) {
        console.error("Error processing the CSV:", err);
    }
}

async function stringsRankedByRelatedness(query, arrayOfObjects, topN = 10) {

    const relatednessFn = (x, y) => 1 - distance( x, y );

    try {

        const response = await openai.embeddings.create({
            model: 'text-embedding-ada-002',
            input: query
        });

        const queryEmbedding = response.data[0].embedding;
        const stringsAndRelatednesses = arrayOfObjects.map(obj => ({
            text: obj.text,
            relatedness: relatednessFn(queryEmbedding, obj.embedding)
        }));

        stringsAndRelatednesses.sort((a, b) => b.relatedness - a.relatedness);

        const topStrings = stringsAndRelatednesses.slice(0, topN).map(obj => obj.text);
        const topRelatednesses = stringsAndRelatednesses.slice(0, topN).map(obj => obj.relatedness);

        return [topStrings, topRelatednesses];
    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function queryMessage(query, arrayOfObjects) {
    const [strings] = await stringsRankedByRelatedness(query, arrayOfObjects); // Assumes you have the previous function
    const introduction = 'Use the below articles on the 2022 Winter Olympics to answer the subsequent question. If the answer cannot be found in the articles, write "I could not find an answer."';
    const question = `\n\nQuestion: ${query}`;
    let message = introduction;
    for (let string of strings) {
      const nextArticle = `\n\nWikipedia article section:\n"""\n${string}\n"""`;
    //   if ((await numTokens(message + nextArticle + question, model)) > tokenBudget) {
    //     break;
    //   } else {
        message += nextArticle;
    //   }
    }
    return message + question;
  }
  
  async function ask(query, arrayOfObjects, printMessage = false) {
    const message = await queryMessage(query, arrayOfObjects);
    if (printMessage) {
      console.log(message);
    }
    const messages = [
      { role: 'system', content: 'You answer questions about the 2022 Winter Olympics.' },
      { role: 'user', content: message }
    ];
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      temperature: 0
    });
    return response.choices[0].message.content;
  }

const main = async () => {
    const data = await processCSV();
    // const result = await stringsRankedByRelatedness('curling gold medal', data, 5);
    const result = await ask('Which athletes won the gold medal in curling at the 2022 Winter Olympics?', data, false)
    console.log(result);
}

main()