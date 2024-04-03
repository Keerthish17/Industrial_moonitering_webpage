  /* eslint-disable react-hooks/exhaustive-deps */
  import React, { useState, useEffect } from 'react';
  import axios from 'axios';
  import './App.css';

  function App() {
    const [channelData, setChannelData] = useState([]);
    const [numResults, setNumResults] = useState(5); // Default value for number of results

    useEffect(() => {
      fetchData();
    }, []); // Fetch data when component mounts

    const fetchData = () => {
      const channelID = '2491004';
      const apiKey = 'EFM0ABGBQIJB7K5G';
      const url = `https://api.thingspeak.com/channels/${channelID}/feeds.json?api_key=${apiKey}&results=${numResults}`;

      axios.get(url)
        .then(response => {
          setChannelData(response.data.feeds);
          handleThresholdCheck(response.data.feeds);
        })
        .catch(error => {
          console.error('Error fetching data:', error);
        });
    };

    const handleThresholdCheck = (data) => {
      data.forEach(entry => {
        const parsedData = parseField1(entry.field1);
        // Assuming thresholds are predefined, you can customize these thresholds according to your requirements
        const thresholds = {
          'Gas value': 1000,
          'Voltage value': 1000,
          'Vibration value': 1000,
          'IR value': 1000,
          'Temperature': 1000,
          'Humidity': 1000,
        };
    
        Object.entries(parsedData).forEach(([param, value]) => {
          if ( value > thresholds[param]) {
            console.log("Threshold exceeded for parameter:", param);
            callSTMPIfThresholdExceeded(param, value); // Pass parameter and value to the function
          }
        });
      });
    };
    
    

    const callSTMPIfThresholdExceeded = (param, value) => {
      console.log("Email triggered for parameter:", param, "with value:", value);
      const stmApiUrl = 'http://localhost:8080/mail/send';
    
      axios.post(stmApiUrl, null, {
        params: {
          param: param, // Pass 'param' as a request parameter
          value: value  // Pass 'value' as a request parameter
        }
      })
      .then(response => {
        console.log('API call to STM successful:', response.data);
      })
      .catch(error => {
        console.error('Error calling STM API:', error);
      });
    };
    
    


    const renderRows = () => {
      return channelData.map(entry => (
        <tr key={entry.entry_id}>
          <td>{entry.entry_id}</td>
          <td>{entry.field1 && parseField1(entry.field1)['Gas value']}</td>
          <td>{entry.field1 && parseField1(entry.field1)['Voltage value']}</td>
          <td>{entry.field1 && parseField1(entry.field1)['Vibration value']}</td>
          <td>{entry.field1 && parseField1(entry.field1)['IR value']}</td>
          <td>{entry.field1 && parseField1(entry.field1)['Temperature']}</td>
          <td>{entry.field1 && parseField1(entry.field1)['Humidity']}</td>
        </tr>
      ));
    };

    const parseField1 = (field1) => {
      if (!field1) {
        return {};
      }

      const data = field1.split('\n').map(item => {
        const keyValue = item.split('=');
        if (keyValue.length === 2) {
          const [param, value] = keyValue;
          return { [param.trim()]: parseInt(value.trim()) };
        }
        return null;
      }).filter(Boolean);

      const parsedData = data.reduce((acc, curr) => {
        return { ...acc, ...curr };
      }, {});

      return parsedData;
    };

    const handleInputChange = (event) => {
      setNumResults(event.target.value);
    };

    const handleSubmit = (event) => {
      event.preventDefault();
      fetchData();
    };

    return (
      <div>
        <h1>ThingSpeak Channel Data</h1>
        <form onSubmit={handleSubmit}>
          <label>
            Number of Data:
            <input type="number" value={numResults} onChange={handleInputChange} />
          </label>
          <button type="submit">Reload</button>
        </form>
        <table>
          <thead>
            <tr>
              <th>Entry ID</th>
              <th>Gas Value</th>
              <th>Voltage Value</th>
              <th>Vibration Value</th>
              <th>IR Value</th>
              <th>Temperature</th>
              <th>Humidity</th>
            </tr>
          </thead>
          <tbody>
            {renderRows()}
          </tbody>
        </table>
      </div>
    );
  }

  export default App;
