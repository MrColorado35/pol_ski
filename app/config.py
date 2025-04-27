import os
from dotenv import load_dotenv

load_dotenv()

IS_PRODUCTION = os.getenv("ENVIRONMENT") == "production"

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("No SECRET_KEY set in environment variables")


ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 240

if IS_PRODUCTION:
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        raise ValueError("No DATABASE_URL set in production environment")
else:
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./pol_ski.db")


APP_NAME = "Pol_Ski"
APP_DESCRIPTION = "Learn practical Polish without the complexity"
APP_VERSION = "0.1.0"