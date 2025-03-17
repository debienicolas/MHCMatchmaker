# MHCMatchmaker

This repository contains the code for the paper:


## Running the application locally


### Installation

1. Clone the repository
   ```
   git clone https://github.com/debienicolas/MHCMatchmaker.git
   cd MHCMatchmaker
   ```

2. Create and activate a virtual environment (recommended)
   ```
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate 
   
   # On macOS/Linux
   source venv/bin/activate
   ```

3. Install dependencies
   ```
   pip install -r requirements.txt
   ```


### Running the Application

Start the application:

```
python app.py
```

The application should now be running at http://localhost:8000 (or the port specified in your configuration).

## Running with Docker

### Prerequisites

- Docker

### Using Docker

1. Build the Docker image
   ```
   docker build -t mhcmatchmaker .
   ```

2. Run the container
   ```
   docker run -p 8000:8000 mhcmatchmaker
   ```

   The application should now be accessible at http://localhost:8000.

