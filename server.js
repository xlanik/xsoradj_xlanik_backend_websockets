const express = require('express');
const port = process.env.PORT || 3000;
const MongoClient = require('mongodb').MongoClient
require('dotenv').config()
const mongoose = require('mongoose');
const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })
const fs = require('fs');
const cors = require('cors')
const app = express()
//const websocket = require('ws');
var expressWs = require('express-ws')(app);


const databaseUri = process.env.MONGODB_URI

app.use(express.json()) //https://stackoverflow.com/questions/18542329/typeerror-cannot-read-property-id-of-undefined
app.use(express.json({limit: '50mb'}));
app.use(cors())



//v envcku v tom database uri si treb premenit nazov databazy z MyfirstDatabase na Autoservis

/*const soket = new websocket.Server({ 
  port: 8082  
})*/


const http = require("http");
const WebSocket = require("ws");
const server = http.createServer(app);
//const wss = new WebSocket.Server({ server });
//const wss = new WebSocket.Server({  port: 8082 });

const Technician = require('./databaseModels/Technicians')
const Customer = require('./databaseModels/Customer')
const Car = require('./databaseModels/Cars')
const RepairedCar = require('./databaseModels/RepairedCars');
const { parse } = require('path');

mongoose.connect(databaseUri, { useNewUrlParser: true })
const db = mongoose.connection
db.on('error', (error) => console.error(error))
db.once('open', () => console.log('Connected to Database'))


app.ws('/', function(ws, req) {
  ws.on('message', async (message) => {

      const parsedMessage = JSON.parse(message);
      console.log(parsedMessage.data);

      switch(parsedMessage.information){
          case "loginCustomer":
            try{
              const loginData = JSON.parse(parsedMessage.data);
              const loginCustomer = await Customer.findOne({ name: loginData.name })
              if(loginCustomer){
                if(loginCustomer.password == loginData.password){
                  ws.send(JSON.stringify({ loginCustomer }));
                  break;
                }
                else{   
                  ws.send(JSON.stringify({ message: "Zle prihlasovacie udaje" }));
                  break;
                }
              }
              else{
                const loginTechnician = await Technician.findOne({ name: loginData.name })
                if(loginTechnician){
                  if(loginTechnician.password == loginData.password){
                    ws.send(JSON.stringify({ loginTechnician }));
                    break;
                  }
                else{
                  ws.send(JSON.stringify({ message: "Zle prihlasovacie udaje" }));
                  break;
                }
                }
              }
              ws.send(JSON.stringify({ message: "Zle prihlasovacie udaje" }));
              break;
            }
            catch(err){
              ws.send(JSON.stringify({ message: err.message }));
              break;
            } 


          case "customerCars":
            const carId = JSON.parse(parsedMessage.data);
            console.log(carId);
            let customerCars
            try {
              customerCars = await Car.find( { customer_id: carId} )
              if (customerCars.length == 0) {
              return ws.send(JSON.stringify({ message: 'Customer has no car in database...' }));
              }
              return ws.send(JSON.stringify({ customerCars }));

            } catch (err) {
              return ws.send(JSON.stringify({ message: err.message }));
            }
          
          case "Technicians":
            if(parsedMessage.method == "GET"){
              try {
                const technicians = await Technician.find()
                return ws.send(JSON.stringify({ technicians }));
              } catch (err) {
                return ws.send(JSON.stringify({ message: err.message }));
              }
            }

            else if(parsedMessage.method == "POST"){
              const information = JSON.parse(parsedMessage.data);
              const technician = new Technician({
                name: information.name,
                password: information.password
              })
              try {
                const newTechnician = await technician.save()
                return ws.send(JSON.stringify({ newTechnician }));
              } catch (err) {
                return ws.send(JSON.stringify({ message: err.message }));
              }
            }
          
          case "TechniciansID":
            const techid = JSON.parse(parsedMessage.data);
            let technician
            try {
              technician = await Technician.findById(techid.id)
              if (technician == null) {
                return ws.send(JSON.stringify({ message: 'Technician is not in the DB' }))
              }
              else return ws.send(JSON.stringify({ technician}));
            } catch (err) {
              return ws.send(JSON.stringify({ message: err.message }))
            }
            
          
          case "Customers":
            if (parsedMessage.method == "GET"){
              try {
                const customers = await Customer.find()
                return ws.send(JSON.stringify({ customers }))
              } catch (err) {
                return ws.send(JSON.stringify({ message: err.message }));
              }
            }
            else if(parsedMessage.method == "POST"){
              const information = JSON.parse(parsedMessage.data);
              const customer = new Customer({
                name: information.name,
                phoneNumber: information.phoneNumber,
                email: information.email,
                password: information.password
              })
              try {
          
                const usedName = await Customer.findOne({ name: information.name })
                const usedPhoneNumber = await Customer.findOne({ phoneNumber: information.phoneNumber })
                const usedEmail = await Customer.findOne({ email: information.email })
          
                if(usedName)  return ws.send(JSON.stringify({ message: "Uzivatel s tymto menom uz je zaregistrovany" }))
                else if(usedPhoneNumber)  return ws.send(JSON.stringify({ message: "Uzivatel s tymto telefonnym cislom uz je zaregistrovany" }))
                else if(usedEmail)  return ws.send(JSON.stringify({ message: "Uzivatel s tymto emailom uz je zaregistrovany" }))
          
                if(!usedName && !usedPhoneNumber && !usedEmail){
                  const newCustomer = await customer.save()
                  return ws.send(JSON.stringify({ newCustomer }))
                }
              } catch (err) {
                return ws.send(JSON.stringify({ message: err.message  }))
              }
            }

          case "CustomersID":
            let customer
            const custid = JSON.parse(parsedMessage.data);
            try {
              customer = await Customer.findById(custid.id)
              if (customer == null) {
                return ws.send(JSON.stringify({ message: 'Customer is not in the DB' }))
              }
            } catch (err) {
              return ws.send(JSON.stringify({ message: err.message }))
            }

            if (parsedMessage.method == "GET"){
              return ws.send(JSON.stringify({ customer }));
            }
            else if (parsedMessage.method == "DELETE"){
              try {
                await customer.remove()
                return ws.send(JSON.stringify({ message: 'Customer was deleted from DB...' }))
              } catch (err) {
                return ws.send(JSON.stringify({ message: err.message  }))
              }
            }

          case "Cars":
            if(parsedMessage.method == "GET"){
              try {
                const cars = await Car.find()
                return ws.send(JSON.stringify({ cars }))
              } catch (err) {
                return ws.send(JSON.stringify({ message: err.message }))
              }
            }
            else if(parsedMessage.method == "POST"){
              const parsedData = JSON.parse(parsedMessage.data);

              const car = new Car({
                customer_id: parsedData.customer_id,
                technician_id: parsedData.technician_id,
                brand: parsedData.brand,
                model: parsedData.model,
                year: parsedData.year,
                oilChange: parsedData.oilChange,
                filterChange: parsedData.filterChange,
                tireChange: parsedData.tireChange,
                engineService: parsedData.engineService,
                state: parsedData.state,
                description: parsedData.description,
                image_url: parsedData.image_url,
                number_plate: parsedData.number_plate
              })
              try {
                const newCar = await car.save()
                return ws.send(JSON.stringify({ newCar }))
              } catch (err) {
                return ws.send(JSON.stringify({ message: err.message }))
              }
            }
          
          case "CarsID":
            const carid = JSON.parse(parsedMessage.data);
            let car;
            try {
              car = await Car.findById(carid.id)
              if (car == null) {
                return ws.send(JSON.stringify({ message: 'Car is not in the DB' }))
              }
            } catch (err) {
              return ws.send(JSON.stringify({ message: err.message }))
            }

            if (parsedMessage.method == "GET"){
              return ws.send(JSON.stringify({ car }));
            }
            else if(parsedMessage.method == "DELETE"){
              try {
                await car.remove()
                return ws.send(JSON.stringify({ message: 'Car was deleted from DB...' }))
              } catch (err) {
                return ws.send(JSON.stringify({ message: err.message }))
              }
            }
            else if(parsedMessage.method == "PATCH"){
              const parsedData = JSON.parse(parsedMessage.data);

              car.oilChange = false
              car.filterChange = false
              car.tireChange = false
              car.engineService = false
              car.state = parsedData.state  //opravene
              car.last_service = new Date()
              car.description = parsedData.description    //z requeste poznamky technika. Potom sa to obvai v jednom poli v historii
              

              try {
                const updatedCar = await car.save()
                return ws.send(JSON.stringify({ updatedCar }))
              } catch (err) {
                return ws.send(JSON.stringify({ message: err.message }))
              }
            }

          case "TechniciansCarsID":
            const technicianid = JSON.parse(parsedMessage.data);
            let technicianCars
            try {
              technicianCars = await Car.find( { technician_id: technicianid} )
              if (technicianCars.length == 0) {
                //return ws.send(JSON.stringify({ message: 'Technician has no assigned cars...' }))
                return ws.send(JSON.stringify({ 
                  information: 'orders',
                  message: 'Technician has no assigned cars...'
                }));
              }
              else return ws.send(JSON.stringify({ 
                information: 'orders',
                data: JSON.stringify(technicianCars)
              }));
              
                       
            } catch (err) {
              return ws.send(JSON.stringify({ 
                information: 'orders',
                message: 'Technician has no assigned cars...'
              }));
            }
            
          
          case "CustomersCarsID":
            const customerid = JSON.parse(parsedMessage.data);
            let customerCar
            try {
              customerCar = await Car.find( { customer_id: customerid.id} )
              if (customerCar.length == 0) {
                return ws.send(JSON.stringify({ message: 'Customer has no car in database...' }));
              }
              else  return ws.send(JSON.stringify({ customerCar }));
            } catch (err) {
              return ws.send(JSON.stringify({  message: err.message }));
            }
            

          case "RepairedCars":
            if(parsedMessage.method == "GET"){
              try {
                const repairedCars = await RepairedCar.find()
                if (repairedCars.length == 0) {
                  //return ws.send(JSON.stringify({ message: 'Technician has no assigned cars...' }))
                  return ws.send(JSON.stringify({ 
                    information: 'history',
                    message: 'No repaired cars in history'
                  }));
                }
                return ws.send(JSON.stringify({ 
                  information: 'history',
                  data: JSON.stringify(repairedCars)
                }));
                
                //ws.send(JSON.stringify({ repairedCars }));
              } catch (err) {
                return ws.send(JSON.stringify({ 
                  information: 'history',
                  message: err.message
                }));
              }
            }
            else if(parsedMessage.method == "POST"){
              const parsedData = JSON.parse(parsedMessage.data);
              const repairedCar = new RepairedCar({
                customer_id: parsedData.customer_id,
                technician_id: parsedData.technician_id,
                brand: parsedData.brand,
                model: parsedData.model,
                year: parsedData.year,
                oilChange: parsedData.oilChange,
                filterChange: parsedData.filterChange,
                tireChange: parsedData.tireChange,
                engineService: parsedData.engineService,
                state: parsedData.state,
                description: parsedData.description,
                image_url: parsedData.image_url,
                number_plate: parsedData.number_plate,
                last_service: parsedData.last_service
              })
              try {
                const NewRepairedCar = await repairedCar.save()
                return ws.send(JSON.stringify({ NewRepairedCar }))
              } catch (err) {
                return ws.send(JSON.stringify({ message: err.message }))
              }
            }
          default: break;
      
      }
  })
})

app.get('/', function(req, res) {
  res.send('LanSor Autoservis zakladny endpoint funguje!')
});


app.listen(process.env.PORT || port, () => console.log(`Listening on ${port}`))
