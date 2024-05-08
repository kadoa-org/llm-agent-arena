module.exports = [
    {
        "query":
            "Here is your task: 1.) Navigate to https://example.com/products. 2.) Extract the names and prices of the first 5 products on the page. " +
            "3.) For each product, click on the 'More Info' link and extract the product specs from the details page. " +
            "4.) Finally, save the extracted data (name, price, and description) for each product to a JSON file and upload it to the file server." +
            "Rules: If you're missing a CSS selector, you need to call the find_selector tool by providing the description. " +
            "To find a specific webpage by description, call the find_page tool.",
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
        "query": "Here is your task: 1) Log in to https://example.com using the provided credentials. " +
            "2) Navigate to the 'Products' page and extract the names and prices of all products that are currently in stock. " +
            "3) For each product, check if there is a detailed specification PDF available by clicking the 'Specs' button and extracting the link. " +
            "4) If a PDF is available, download it and extract the table of technical specifications. " +
            "5) Finally, upload the parsed technical specifications to the file server. After the successful upload, you're finished and don't need to call any other tools." +
            "Rules: If you're missing a CSS selector, you need to call the find_selector tool by providing the description. " +
            "To find a specific webpage by description, call the find_page tool.",
        "expectedTools": [
            "handle_login",
            "navigate_to_url",
            "extract_text",
            "click_element",
            "extract_attribute",
            "download_and_parse_pdf",
            "extract_specs_table",
            "upload_to_file_server"
        ],
        "expectedLastStep": "upload_to_file_server",
        "parameters": {
            "login_url": "https://example.com/login",
            "username": "testuser",
            "password": "testpassword"
        },
        "level": "hard"
    }
];