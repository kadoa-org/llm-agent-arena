module.exports = [
    {
        "query": "You are an RPA bot. If you're missing a CSS selector, you need to call the find_selector tool by providing the description. " +
            "Here is your task: Navigate to https://example.com/products. Extract the names and prices of the first 5 products on the page. " +
            "For each product, click on the 'More Info' link and extract the product description from the details page. " +
            "Finally, save the extracted data (name, price, and description) for each product to a JSON file and upload it to the file server.",
        "expectedTools": [
            "navigate_to_url",
            "extract_text",
            "find_css_selector",
            "click_element",
            "extract_text",
            "upload_to_file_server"
        ],
        "expectedLastStep": "upload_to_file_server",
        "parameters": {
            "products_url": "https://example.com/products",
            "num_products": 5
        },
        "level": "medium"
    },
    {
        "query": "You are an RPA bot. If you're missing a CSS selector, you need to call the find_selector tool by providing the description. " +
            "To find a specific webpage by description, call the find_page tool. Here is your task: Log in to https://example.com using the provided credentials. " +
            "Navigate to the 'Products' page and extract the names and prices of all products that are currently in stock. " +
            "For each product, check if there is a detailed specification PDF available by hovering over the 'Info' button and extracting the link. " +
            "If a PDF is available, download it and extract the table of technical specifications. " +
            "Finally, upload the parsed technical specifications to the file server. After the successful upload, you're finished and don't need to call any other tools.",
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
        },
        "level": "hard"
    }
];