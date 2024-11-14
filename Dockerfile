FROM python:3.13

WORKDIR /code

COPY C:/Users/leo09/My_Fastapi_Project/requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

COPY C:/Users/leo09/My_Fastapi_Project/app /code/app

CMD ["fastapi", "run", "app/main.py", "--port", "80"]