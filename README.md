# districtizer
A small webapp to create geographical districts (by drawing polygons onto a Google Maps instance) and assigning locations to those districts.

To use:

 - Make sure the Python install has all requirements:  
   ```pip install -r requirements.txt``` (this will install all missing packages)
 - Run the server:  
   ```./server.py --port 8080``` (the server script defaults to port 80)
 - Go to [http://localhost:8080/](http://localhost:8080)