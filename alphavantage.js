"use strict";
(function(){
  const ALPHA_BASE_URL ='https://www.alphavantage.co/query?function=';
  const API_KEY = "GO0XOM99ELM2L86Q";
  // Price Indicator 
  const PRICE_EP = 'TIME_SERIES_DAILY_ADJUSTED&symbol=';
  // RSI Indicator
  const RSI_EP = 'RSI&symbol=';
  // Overview EP
  const OVERVIEW_EP = "OVERVIEW&symbol="
  // Graph Layout Properties
  const graphProp = {
    staticPlot: true
  }
  // Caps the number of datapoints to use.
  const numDataPoints = 150;

  /**
   * Sets up the button listener to fetch data from the Alphavantage
   * and then uses the data to plot intraday trading of the past data points.
   */
  function init() {
    id("chart-btn").addEventListener("click", fetchStock);

  }

  /**
   * Makes the fetch call to Alphavantage API
   * Upon success, shows daily stock price data and RSI strength indicators.
   * If an error occurs, displays a message on the page appropriately.
   */
  function fetchStock() {
    // display loading text and disable button while ajax call is loading
    id("response-message").textContent = "Graphing ...";
    id("response").innerHTML = "";
    id("rsi-message").textContent = "Graphing ...";
    id("rsi-response").innerHTML = "";
    id("chart-btn").disabled = true;

    // Check for a ticker input
    if (!id("ticker").value) {
        let response = document.createElement("p");
        let msg = "Please choose a ticker first.";
        response.textContent = msg;
        id("response").appendChild(response);
        id("response-message").textContent = "Graph";
        id("rsi-message").textContent = "RSI Indicator";
        id("chart-btn").disabled = false; // re-enable the button
    } else {
        // Fill in general company info
        let url = ALPHA_BASE_URL + OVERVIEW_EP + id("ticker").value.toUpperCase() + '&apikey=' + API_KEY;
        fetch(url)
        .then(checkStatus)
        .then(response => response.json())
        .then(processOverview)
        .catch(handleRequestError)

        // Add pauses between fetches to prevent errors. 
        // Fetches the stock price graph, only the most recent 150 days of data.
        url = ALPHA_BASE_URL + PRICE_EP + id("ticker").value.toUpperCase() + '&outputsize=150&apikey=' + API_KEY;
        fetch(url)
        .then(checkStatus)
        .then(response => response.json())
        .then(processStockData)
        .catch(handleRequestError);
        
        // Fetches the RSI graph
        url = ALPHA_BASE_URL + RSI_EP + id("ticker").value.toUpperCase(); 
        url += '&interval=daily&time_period=10&series_type=close&apikey=' + API_KEY;
        fetch(url)
        .then(checkStatus)
        .then(response => response.json())
        .then(processRSIData)
        .catch(handleRequestError);
    }
  }

  function processOverview(overviewJSON) {
    id("overview").innerHTML = "";

    let companyName = document.createElement("h2");
    companyName.textContent = overviewJSON["Name"];

    let companyDesc = document.createElement("p");
    companyDesc.textContent = overviewJSON["Description"];

    id("overview").appendChild(companyName);
    id("overview").appendChild(companyDesc);
  }

  /**
   * Processes the response to display Alphavantage information on the page
   * with a graph using Plotly library
   * @param {Object} stockJSON - the parsed JSON object that is was returned 
   * from the request.
   */
  function processStockData(stockJSON){
    // Reset response box
    id("response-message").textContent = stockJSON["Meta Data"]["2. Symbol"] +  " Stock Price";

    let graph = document.createElement("div");
    graph.id = "stockGraph";

    id("response").appendChild(graph);

    // Parse and process time series.
    let data = prepareTimeSeries(stockJSON);

    let layout = {
      title: "Closing Price Chart"
    }

    Plotly.newPlot('stockGraph', data, layout, graphProp);

    //re-enable button
    id("chart-btn").disabled = false;
  }

  /**
   * Parses the json data and produces a data object that it is readily plotable from Plotly
   * @param {JSON object} data - the parsed JSON object returned from the request to the API
   * @returns preparedData - In the form of an array [ {x: xData, y: yData, type:"scatter"}] 
   */
  function prepareTimeSeries(data) {
    let x_data =  Object.keys(data["Time Series (Daily)"]);
    let y_data = [];
    for (let key of x_data) {
        y_data.push(parseFloat(data["Time Series (Daily)"][key]["4. close"]));
    }

    // Format data for Plotly
    let preparedData = [
        {
            x: x_data, y: y_data, type:"scatter"
        }
    ];

    return preparedData
  }

  /**
   * Prepares the response from RSI API endpoint and graphs it using Plotly
   * @param {JSON object} rsiJSON - the parsed JSON object returned from the request to the API
   */
  function processRSIData(rsiJSON) {
    // Reset response box
    id("rsi-message").textContent = rsiJSON["Meta Data"]["1: Symbol"] + " RSI Indicator";

    let graph = document.createElement("div");
    graph.id = "rsiGraph";

    id("rsi-response").appendChild(graph);

    // Parse and process time series.
    let data = prepareRSITimeSeries(rsiJSON);

    let layout = {
      title: "RSI Strength Indicator Chart"
    }
    Plotly.newPlot('rsiGraph', data, layout, graphProp);

    //re-enable button
    id("chart-btn").disabled = false;
  }

  /**
   * Parses the RSI json data and produces a data object that it is readily plotable from Plotly
   * @param {JSON object} data - the parsed JSON object returned from the request to the API
   * @returns preparedData - In the form of an array [ {x: xData, y: yData, type:"scatter"}] 
   */
  function prepareRSITimeSeries(data) {
    let x_data =  Object.keys(data["Technical Analysis: RSI"]);
    let y_data = [];
    for (let key of x_data) {
        y_data.push(parseFloat(data["Technical Analysis: RSI"][key]["RSI"]));
    }

    // Format data for Plotly
    let preparedData = [
        {
            x: x_data.slice(0, numDataPoints), y: y_data.slice(0, numDataPoints), type:"scatter"
        }
    ];

    return preparedData
  }

  /**
   * This function is called when an error occurs in the fetch call chain 
   * (e.g. the request returns a non-200 error code, such as when the Alphavantage 
   * service is down). Displays a user-friendly error message on the page and 
   * re-enables the stockChart button.
   * @param {Error} err - the error details of the request.
   */
  function handleRequestError(err) {
    // ajax call failed! alert, place text and re-enable the button
    let response = document.createElement("p");
    let msg = "There was an error requesting data from the Alphavantage service. " + 
              "Please check the ticker again or try again later.";
    response.textContent = msg;
    id("overview").appendChild(response);
    id("response-message").textContent = "Graph";
    id("rsi-message").textContent = "RSI Indicator";
    id("chart-btn").disabled = false; // re-enable the button
  }

  /* ------------------------------ Helper Functions  ------------------------------ */
  // Note: You may use these in your code, but do remember that your code should not have
  // any functions defined that are unused.

  /**
   * Returns the element that has the ID attribute with the specified value.
   * @param {string} idName - element ID
   * @returns {object} DOM object associated with id.
   */
  function id(idName) {
    return document.getElementById(idName);
  }

  /**
   * Helper function to return the Response data if successful, otherwise
   * returns an Error that needs to be caught.
   * @param {object} response - response with status to check for success/error.
   * @returns {object} - The Response object if successful, otherwise an Error that
   * needs to be caught.
   */
  function checkStatus(response) {
    if (!response.ok) { // response.status >= 200 && response.status < 300
     throw Error("Error in request: " + response.statusText);
    } // else, we got a response back with a good status code (e.g. 200)
    return response; // A Response object.
  }

  init();
})();
