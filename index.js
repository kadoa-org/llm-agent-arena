const {Anthropic} = require('@anthropic-ai/sdk');
const OpenAI = require("openai");
const tools = require("./tools");
const Groq = require("groq-sdk");
const {VertexAI} = require("@google-cloud/vertexai");
const fs = require('fs').promises;


const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});


const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const groq = new Groq({apiKey: process.env.GROQ_API_KEY});


const CLAUDE_MODEL = "claude-3-sonnet-20240229"
const GPT_MODEL = "gpt-4-0125-preview"
const GROQ_MODEL = "llama3-70b-8192"
const GEMINI_MODEL = "gemini-1.5-pro-preview-0409"

const costConfig = {
    'gpt-4-0125-preview': {
        inputCostPer1MTokens: 10.00,
        outputCostPer1MTokens: 30.00,
    },
    'gpt-3.5-turbo-0125': {
        inputCostPer1MTokens: 0.50,
        outputCostPer1MTokens: 1.50,
    },
    'claude-3-opus-20240229': {
        inputCostPer1MTokens: 15.00,
        outputCostPer1MTokens: 75.00,
    },
    'claude-3-sonnet-20240229': {
        inputCostPer1MTokens: 3.00,
        outputCostPer1MTokens: 15.00,
    },
    'gemini-1.5-pro-preview-0409': {
        inputCostPer1MTokens: 2.50,
        outputCostPer1MTokens: 7.50,
    },
    'llama3-70b-8192': {
        inputCostPer1MTokens: 0.59,
        outputCostPer1MTokens: 0.79,
    },
    'mixtral-8x7b-32768': {
        inputCostPer1MTokens: 0.27,
        outputCostPer1MTokens: 0.27,
    },
    'llama3-8b-8192': {
        inputCostPer1MTokens: 0.05,
        outputCostPer1MTokens: 0.10,
    }
};

const testCases = [
    {
        "query": "You are an RPA bot. If you're missing a CSS selector, you need to call the find_selector tool by providing the description. To find a specific webpage by description, call the find_page tool. Here is your task: Log in to https://example.com using the provided credentials. Navigate to the 'Products' page and extract the names and prices of all products that are currently in stock. For each product, check if there is a detailed specification PDF available by hovering over the 'Info' button and extracting the link. If a PDF is available, download it and extract the table of technical specifications. Finally, upload the parsed technical specifications to the file server.",
        "expectedTools": [
            "handle_login",
            "navigate_to_url",
            "extract_text",
            "hover_element",
            "extract_attribute",
            "download_and_parse_pdf",
            "extract_specs_table",
            "upload_to_file_server"
        ],
        "expectedLastStep": "upload_to_file_server",
        "parameters": {
            "login_url": "https://example.com/login",
            "submit_selector": "#login-button",
            "username": "testuser",
            "password": "testpassword"
        }
    }
];

async function testClaude(testCase) {
    const results = []
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    let messages = [
        {
            "role": "user",
            "content": `${testCase.query}\n\nAdditional Parameters:\n${JSON.stringify(testCase.parameters, null, 2)}`
        }
    ];

    let response = await anthropic.messages.create(
        {
            max_tokens: 3024,
            model: CLAUDE_MODEL,
            tools: tools,
            messages: messages
        },
        {headers: {'anthropic-beta': 'tools-2024-04-04'}}
    );

    console.log(`\nInitial Response:`);
    console.log(`Stop Reason: ${response.stop_reason}`);
    console.log(`Content: ${JSON.stringify(response.content, null, 2)}`);

    while (response.stop_reason === "tool_use") {
        const toolUse = response.content.find(block => block.type === "tool_use");
        const toolName = toolUse.name;
        const toolInput = toolUse.input;
        totalInputTokens += response.usage.input_tokens;
        totalOutputTokens += response.usage.output_tokens;
        results.push(toolUse)
        const toolFunction = tools.find(tool => tool.name === toolName).function;
        const toolResult = await toolFunction(JSON.stringify(toolInput, null, 2));

        messages = [
            ...messages,
            {"role": "assistant", "content": response.content},
            {
                "role": "user",
                "content": [
                    {
                        "type": "tool_result",
                        "tool_use_id": toolUse.id,
                        "content": JSON.stringify(toolResult),
                    }
                ],
            },
        ];

        response = await anthropic.messages.create(
            {
                max_tokens: 3024,
                model: CLAUDE_MODEL,
                tools: tools,
                messages: messages
            },
            {headers: {'anthropic-beta': 'tools-2024-04-04'}}
        );

        console.log(`\nResponse:`);
        console.log(`Stop Reason: ${response.stop_reason}`);
        console.log(`Content: ${JSON.stringify(response.content, null, 2)}`);
    }

    const finalResponse = response.content.find(block => block.type === "text")?.text;
    console.log(`\nFinal Response: ${finalResponse}`);
    results.push(finalResponse)

    const cost = calculateCost(CLAUDE_MODEL, totalInputTokens, totalOutputTokens);

    return {
        results,
        cost: cost.toFixed(6),
    };
}

async function testGroq(testCase) {
    const results = [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    const messages = [
        {
            role: "system",
            content: "You are a function calling LLM that uses the data extracted from the provided tools to answer questions and perform tasks.",
        },
        {
            role: "user",
            content: `${testCase.query}\n\nAdditional Parameters:\n${JSON.stringify(testCase.parameters, null, 2)}`,
        },
    ];

    const mappedTools = tools.map((tool) => ({
        type: "function",
        function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.input_schema,
        },
    }));

    try {
        let response = await groq.chat.completions.create({
            model: GROQ_MODEL,
            messages: messages,
            tools: mappedTools,
            tool_choice: "auto"
        });
        console.log(`\nInitial Response:`);
        console.log(`Content: ${JSON.stringify(response.choices[0].message, null, 2)}`);

        while (response.choices[0].message.tool_calls) {
            const toolCalls = response.choices[0].message.tool_calls;
            totalInputTokens += response.usage.prompt_tokens;
            totalOutputTokens += response.usage.completion_tokens;

            for (const toolCall of toolCalls) {
                const toolName = toolCall.function.name;
                const toolInput = JSON.parse(toolCall.function.arguments);
                results.push({type: "tool_use", name: toolName, input: toolInput});

                const toolFunction = tools.find((tool) => tool.name === toolName).function;
                const toolResult = await toolFunction(JSON.stringify(toolInput, null, 2));

                messages.push({
                    tool_call_id: toolCall.id,
                    role: "tool",
                    name: toolName,
                    content: JSON.stringify(toolResult),
                });
            }

            response = await groq.chat.completions.create({
                model: GROQ_MODEL,
                messages: messages,
                tools: mappedTools,
                tool_choice: "auto"
            });

            console.log(`\nResponse:`);
            console.log(`Content: ${JSON.stringify(response.choices[0].message, null, 2)}`);
        }

        const finalResponse = response.choices[0].message.content;
        console.log(`\nFinal Response: ${finalResponse}`);
        results.push(finalResponse);

        const cost = calculateCost(GROQ_MODEL, totalInputTokens, totalOutputTokens);

        return {results, cost: cost.toFixed(6)};
    } catch (e) {
        console.log(e)
    }

}

async function testGPT(testCase) {
    const results = []
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    const mappedTools = tools.map(tool => ({
        type: 'function',
        function: {
            name: tool.name,
            description: tool.description,
            function: tool.function,
            parameters: tool.input_schema,
        },
    }));
    const runner = openai.beta.chat.completions
        .runTools({
            model: GPT_MODEL,
            messages: [{
                role: 'user',
                content: `${testCase.query}\n\nAdditional Parameters:\n${JSON.stringify(testCase.parameters, null, 2)}`
            }],
            tools: mappedTools,
        })
        .on('message', (message) => {
            console.log(message)
            results.push(message)
        });

    const finalContent = await runner.finalContent();
    console.log('Final content:', finalContent);
    const finalUsage = await runner.totalUsage();
    totalInputTokens += finalUsage.prompt_tokens;
    totalOutputTokens += finalUsage.completion_tokens;
    const cost = calculateCost(GPT_MODEL, totalInputTokens, totalOutputTokens);

    results.push(finalContent)
    return {
        results,
        cost: cost.toFixed(6),
    };
}

async function testGemini(
    testCase,
    projectId = process.env.GOOGLE_PROJECT_ID,
    location = 'us-central1',
    model = GEMINI_MODEL,
) {
    // Initialize Vertex with your Cloud project and location
    const vertexAI = new VertexAI({
        project: projectId,
        location: location,
        googleAuthOptions: {keyFilename: "application_default_credentials.json"}
    });
    const mappedTools = tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: {
            type: tool.input_schema.type.toUpperCase(),
            properties: Object.entries(tool.input_schema.properties).reduce((acc, [key, value]) => {
                acc[key] = {...value, type: value.type.toUpperCase()};
                return acc;
            }, {}),

        }
    }));
    const functionDeclarations = [
        {
            functionDeclarations: mappedTools,
        },
    ];
    const functionResponseParts = [];
    const results = [];

    // Instantiate the model
    const geminiModel = vertexAI.getGenerativeModel({
        model: model,
    });

    const request = {
        contents: [
            {role: 'user', parts: [{text: testCase.query}]},
        ],
        tools: functionDeclarations,
    };
    let result = await geminiModel.generateContent(request);
    const response = result.response;
    let functionCallPart = response.candidates[0].content.parts.find(part => part.functionCall);
    let functionCall = functionCallPart?.functionCall;
    let functionName = functionCall?.name;

    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    while (functionName) {
        //while function calls, loop over it
        const toolFunction = tools.find((tool) => tool.name === functionName).function;
        const toolResult = await toolFunction(JSON.stringify(functionCall?.args, null, 2));
        functionResponseParts.push(
            {
                functionResponse: {
                    name: functionName,
                    response: {name: functionName, content: toolResult},
                },
            },
        );
        results.push({type: "tool_use", name: functionName, input: functionCall?.args});

        const req2 = {
            contents: [
                {role: 'user', parts: [{text: testCase.query}]},
                result.response.candidates[0].content,
                {role: 'user', parts: functionResponseParts},
            ],
            tools: functionDeclarations,
        };

        result = await geminiModel.generateContent(req2);
        functionCallPart = result.response.candidates[0].content.parts.find(part => part.functionCall);
        functionCall = functionCallPart?.functionCall;
        functionName = functionCall?.name;

        totalInputTokens += result.response.usageMetadata.promptTokenCount;
        totalOutputTokens += result.response.usageMetadata.candidatesTokenCount;

        console.log(response);
    }

    const finalResponse = result.response.candidates[0].content.parts.find(part => part.text)?.text;
    results.push(finalResponse);

    const cost = calculateCost(model, totalInputTokens, totalOutputTokens);
    return {results, cost: cost.toFixed(6)};
}

function calculateAccuracy(usedTools, expectedTools) {
    const uniqueUsedTools = [...new Set(usedTools)];
    const correctTools = uniqueUsedTools.filter(tool => expectedTools.includes(tool));
    return correctTools.length / expectedTools.length;
}

function calculateCost(modelName, inputTokens, outputTokens) {
    const {inputCostPer1MTokens, outputCostPer1MTokens} = costConfig[modelName];

    const inputCost = (inputTokens / 1000000) * inputCostPer1MTokens;
    const outputCost = (outputTokens / 1000000) * outputCostPer1MTokens;

    return inputCost + outputCost;
}

async function main() {
    const claudeResults = [];
    const gptResults = [];
    const groqResutls = [];
    const geminiResults = [];

    for (const testCase of testCases) {
        console.log(`\n${'='.repeat(50)}\nTest Case: ${testCase.query}\n${'='.repeat(50)}`);


        const geminiResult = await testGemini(testCase);
        geminiResults.push(geminiResult.results);
        const vertexCost = geminiResult.cost;

        const geminiToolsUsed = geminiResult.results.filter(c => c.type === "tool_use").map(toolUse => toolUse.name);
        const geminiToolsAccuracy = calculateAccuracy(geminiToolsUsed, testCase.expectedTools);
        const geminiOutputAccuracy = geminiToolsUsed[geminiToolsUsed.length - 1] === testCase.expectedLastStep;

        console.log(`\nGemini Evaluation:`);
        console.log(`Model Used: ${GEMINI_MODEL}`);
        console.log(`Number of Tool Calls: ${geminiToolsUsed.length}`);
        console.log(`Tools Used: ${geminiToolsUsed}`);
        console.log(`Tools Accuracy: ${geminiToolsAccuracy}`);
        console.log(`Correct Result: ${geminiOutputAccuracy}`);
        console.log(`Cost: $${vertexCost}`);


        const groqResult = await testGroq(testCase);
        groqResutls.push(groqResult.results);
        const groqCost = groqResult.cost;

        const groqToolsUsed = groqResult.results.filter(c => c.type === "tool_use").map(toolUse => toolUse.name);
        const groqToolsAccuracy = calculateAccuracy(groqToolsUsed, testCase.expectedTools);
        const groqOutputAccuracy = groqToolsUsed[groqToolsUsed.length - 1] === testCase.expectedLastStep;

        console.log(`\nGroq Evaluation:`);
        console.log(`Model Used: ${GROQ_MODEL}`);
        console.log(`Number of Tool Calls: ${groqToolsUsed.length}`);
        console.log(`Tools Used: ${groqToolsUsed}`);
        console.log(`Tools Accuracy: ${groqToolsAccuracy}`);
        console.log(`Correct Result: ${groqOutputAccuracy}`);
        console.log(`Cost: $${groqCost}`);


        const claudeResult = await testClaude(testCase);
        claudeResults.push(claudeResult.results);
        const claudeCost = claudeResult.cost;

        // Evaluate Claude's performance
        const claudeToolsUsed = claudeResult.results.filter(c => c.type === "tool_use").map(toolUse => toolUse.name);
        const claudeToolsAccuracy = calculateAccuracy(claudeToolsUsed, testCase.expectedTools);
        const claudeOutputAccuracy = claudeToolsUsed[claudeToolsUsed.length - 1] === testCase.expectedLastStep;

        console.log(`\nClaude Evaluation:`);
        console.log(`Model Used: ${CLAUDE_MODEL}`);
        console.log(`Number of Tool Calls: ${claudeToolsUsed.length}`);
        console.log(`Tools Used: ${claudeToolsUsed}`);
        console.log(`Tools Accuracy: ${claudeToolsAccuracy}`);
        console.log(`Correct Result: ${claudeOutputAccuracy}`);
        console.log(`Cost: $${claudeCost}`);

        const gptResult = await testGPT(testCase);
        gptResults.push(gptResult.results);
        const gptCost = gptResult.cost;


        // Evaluate GPT's performance
        const gptToolsUsed = gptResult.results.flatMap(message =>
            message.tool_calls ? message.tool_calls.map(toolCall => toolCall.function.name) : []
        );
        const gptToolsAccuracy = calculateAccuracy(gptToolsUsed, testCase.expectedTools);
        const gptOutputAccuracy = gptToolsUsed[gptToolsUsed.length - 1] === testCase.expectedLastStep;

        console.log(`\nGPT Evaluation:`);
        console.log(`Model Used: ${GPT_MODEL}`);
        console.log(`Number of Tool Calls: ${gptToolsUsed.length}`);
        console.log(`Tools Used: ${gptToolsUsed}`);
        console.log(`Tools Accuracy: ${gptToolsAccuracy}`);
        console.log(`Correct Result: ${gptOutputAccuracy}`);
        console.log(`Cost: $${gptCost}`);
    }

    await fs.writeFile('results/claude_results.json', JSON.stringify(claudeResults, null, 2));
    await fs.writeFile('results/gpt_results.json', JSON.stringify(gptResults, null, 2));
    console.log('Results saved to JSON files.');
}

main();