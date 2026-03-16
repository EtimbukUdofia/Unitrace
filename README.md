# Unitrace: Smart Attendance Tracking System

## Project Overview
Unitrace is an innovative attendance tracking system designed to streamline the process of taking attendance using QR codes, geofencing, and location services. This system enables educational institutions to enhance student engagement and automate attendance tracking processes.

## Key Features
### For Students  
- **QR Code Scanning:** Quick and easy check-in using personalized QR codes.  
- **Geofencing:** Automatic attendance marking when students enter designated areas.  
- **Real-time Notifications:** Students receive instant updates regarding attendance status.  

### For Lecturers  
- **Automated Attendance Reports:** Generate reports with a single click.  
- **Dashboard:** Overview of student attendance trends and statistics.  
- **Customizable Settings:** Adjust geofencing and attendance parameters based on course requirements.  

## Architecture  
Unitrace is built using a microservices architecture that separates different functionalities into distinct services for better scalability and maintainability.

## Technology Stack  
- **Frontend:** React.js  
- **Backend:** Node.js, Express  
- **Database:** MongoDB  
- **Deployment:** Docker, Kubernetes  

## Project Structure  
- `/client` — Contains the frontend code.  
- `/server` — Contains the backend code.  
- `/docs` — Project documentation.  
- `/tests` — Unit and integration tests.  

## Setup Instructions  
1. Clone the repository:  
   ```
   git clone https://github.com/EtimbukUdofia/Unitrace.git
   ```  
2. Navigate into the client and server directories and install dependencies:  
   ```
   cd client && npm install
   cd ../server && npm install
   ```  
3. Configure environment variables as specified in the `.env` file.  
4. Start the application:  
   ```
   # For client  
   cd client && npm start
   # For server  
   cd server && npm start
   ```  

## Security Considerations  
- Ensure that all user data is encrypted during transmission and storage.  
- Implement proper authentication and authorization measures to safeguard user accounts.  
- Regularly update dependencies to mitigate security vulnerabilities.  

## Future Enhancements  
- Integrate facial recognition technology for enhanced attendance verification.  
- Mobile app version for better accessibility.  
- Advanced analytics features for detailed insights into attendance patterns and student engagement.

---  
For detailed documentation, visit the [docs](./docs) directory.