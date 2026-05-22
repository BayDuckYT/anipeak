```
{
  "files": [
    {
      "path": "C:\\Users\\Murathan\\Desktop\\animain2\\public\\index.html",
      "content": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Document</title>\n    <link rel=\"stylesheet\" href=\"styles.css\">\n</head>\n<body>\n    <h1>Hello World!</h1>\n</body>\n</html>"
    },
    {
      "path": "C:\\Users\\Murathan\\Desktop\\animain2\\public\\styles.css",
      "content": "/* Global Styles */\n* {\n    box-sizing: border-box;\n    margin: 0;\n    padding: 0;\n}\nbody {\n    font-family: Arial, sans-serif;\n    line-height: 1.6;\n}\nh1 {\n    color: #00698f;\n}\n"
    },
    {
      "path": "C:\\Users\\Murathan\\Desktop\\animain2\\src\\assets\\images\\logo.png",
      "content": "/* Logo Image */\n"
    },
    {
      "path": "C:\\Users\\Murathan\\Desktop\\animain2\\src\\components\\Header.js",
      "content": "// Import React\nimport React from 'react';\n\n// Define the Header component\nconst Header = () => {\n    return <h1>Header</h1>\n};\n\nexport default Header;"
    },
    {
      "path": "C:\\Users\\Murathan\\Desktop\\animain2\\src\\pages\\Home.js",
      "content": "// Import React and use the createBrowserHistory hook from react-router-dom\nimport React from 'react';\nimport { createBrowserHistory } from 'react-router-dom';\n\n// Define the Home page component\nconst Home = () => {\n    const history = createBrowserHistory();\n    return <h1>Welcome to the Home page!</h1>\n};\n\nexport default Home;"
    },
    {
      "path": "C:\\Users\\Murathan\\Desktop\\animain2\\src\\services\\api\\auth.js",
      "content": "// Import Axios library for making HTTP requests\nimport axios from 'axios';\n\n// Define the login function\nconst login = async (username, password) => {\n    try {\n        const response = await axios.post('/login', { username, password });\n        return response.data;\n    } catch (error) {\n        console.error(error);\n        return null;\n    }\n};\n\nexport default login;"
    },
    {
      "path": "C:\\Users\\Murathan\\Desktop\\animain2\\src\\config\\env.js",
      "content": "// Define environment variables\nconst env = {\n    API_URL: 'https://api.example.com',\n    CLIENT_ID: 'your_client_id_here',\n    CLIENT_SECRET: 'your_client_secret_here'\n};\n\nexport default env;"
    },
    {
      "path": "C:\\Users\\Murathan\\Desktop\\animain2\\tests\\components\\Header.test.js",
      "content": "// Import React and Jest library for testing\nimport React from 'react';\nimport { render } from '@testing-library/react';\n\n// Define the test suite for the Header component\ndescribe('Header', () => {\n    it('renders correctly', () => {\n        const { getByText } = render(<Header />);
        expect(getByText('Header')).toBeInTheDocument();\n    });\n})"
    },
    {
      "path": "C:\\Users\\Murathan\\Desktop\\animain2\\tests\\pages\\Home.test.js",
      "content": "// Import React and Jest library for testing\nimport React from 'react';\nimport { render } from '@testing-library/react';\n\n// Define the test suite for the Home page component\ndescribe('Home', () => {\n    it('renders correctly', () => {\n        const { getByText } = render(<Home />);
        expect(getByText('Welcome to the Home page!')).toBeInTheDocument();\n    });\n})"
    }
  ]
}
```