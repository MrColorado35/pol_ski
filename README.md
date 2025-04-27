# Pol_Ski: Learn Simplified Polish

Pol_Ski is a web application designed to make learning Polish more accessible. Instead of overwhelming beginners with complex grammar and numerous word forms, Pol_Ski focuses on teaching simplified, practical Polish for everyday communication.

## Features

- **Simplified Learning Approach**: Focus on just one form of each word, making it easier to get started with Polish
- **Interactive Lessons**: Progress through structured lessons organized by categories
- **Vocabulary Building**: Learn essential Polish words with proper pronunciation
- **Progress Tracking**: Track your learning journey with built-in progress monitoring
- **Spaced Repetition**: Review words based on scientific principles of memory retention
- **Interactive Practice**: Test your knowledge with multiple choice quizzes and interactive exercises
- **User Accounts**: Create an account to save your progress

## Technologies Used

- **Backend**: FastAPI (Python)
- **Database**: SQLite (easily upgradable to PostgreSQL for production)
- **Frontend**: HTML, CSS, JavaScript with Bootstrap 5
- **Authentication**: JWT-based authentication

## Getting Started

### Prerequisites

- Python 3.7 or higher
- pip (Python package manager)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/mrcolorado35/pol_ski.git
cd pol_ski
```

2. **Create a virtual environment**

```bash
python -m venv venv
```

3. **Activate the virtual environment**

On Windows:
```bash
venv\Scripts\activate
```

On macOS/Linux:
```bash
source venv/bin/activate
```

4. **Install dependencies**

```bash
pip install -r requirements.txt
```

5. **Set up environment variables**

Create a `.env` file in the project root with the following variables:
```
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///./pol_ski.db
```

You can use the provided `.env.example` as a template.

6. **Initialize the database**

```bash
python -m app.init_db
```

7. **Run the application**

```bash
uvicorn app.main:app --reload
```

8. **Access the application**

Open your browser and navigate to `http://localhost:8000`

## Project Structure

```
pol_ski/
├── app/
│   ├── __init__.py
│   ├── main.py              # Main application entry point
│   ├── database.py          # Database configuration
│   ├── config.py            # Application configuration
│   ├── dependencies.py      # FastAPI dependencies
│   ├── crud.py              # Database operations
│   ├── schemas.py           # Pydantic schemas
│   ├── init_db.py           # Database initialization script
│   ├── models/              # Database models
│   ├── routes/              # API endpoints
│   ├── templates/           # HTML templates
│   ├── static/              # Static files (CSS, JS)
│   └── data/                # Sample data for initialization
└── requirements.txt         # Python dependencies
```

## API Documentation

Once the application is running, you can access the API documentation at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Deployment

### Deploying to PythonAnywhere

1. Create a PythonAnywhere account if you don't have one
2. Upload your project files (excluding virtual environment)
3. Create a new web app, selecting "Manual configuration" and your Python version
4. Set up a virtual environment on PythonAnywhere and install dependencies
5. Configure your WSGI file to point to your FastAPI application
6. Configure environment variables in the PythonAnywhere dashboard
7. Reload your web app

## Development Approach

Pol_Ski approaches Polish language learning differently from traditional methods:

1. **One form per noun**: Instead of teaching all seven grammatical cases, we focus on just the nominative case for beginners
2. **Simplified verb forms**: We teach the most common, useful forms of verbs rather than all conjugations
3. **Essential vocabulary**: We focus on the 300-500 most practical words for everyday communication
4. **Practical phrases**: Ready-to-use expressions for common situations

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by simplified approaches to language learning
- Built with FastAPI and Bootstrap 5
- Special thanks to contributors and language learning enthusiasts