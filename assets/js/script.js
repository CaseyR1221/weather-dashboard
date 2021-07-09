let searchBtn = document.querySelector('.searchBtn');
let clearBtn = document.querySelector('.clearBtn');
let locateBtn = document.querySelector('.locateBtn');
// weatherInfo holds the JSON response from the weather API
let weatherInfo, cityName, historyBtn;
let historyEl = document.querySelector("#history"); 
let toggle = false;
let searchHistory = JSON.parse(localStorage.getItem("searchHistory"));
let input = document.getElementById("search-input");

const init = () => {
    getCurrentLocation();
    getSearchHistory();
};

const getSearchHistory = () => {
    if(searchHistory == null) {
        console.log("There is no search history data in local storage, creating a blank array");
        searchHistory = [];
    }
    // if there is an array, run the function
    else {
        handleFillHistory();
    }
};

const handleFillHistory = () => {
    for (let i = 0; i < searchHistory.length && i < 8; i++) {
        let buttonDiv = document.createElement("div")
        let buttonEl = document.createElement("button");

        buttonDiv.classList.add("d-grid", "mt-2");

        buttonEl.classList.add("btn", "btn-secondary", "historyBtn");
        buttonEl.dataset.city = searchHistory[i];
        buttonEl.textContent = searchHistory[i];

        historyEl.append(buttonDiv);

        buttonDiv.append(buttonEl);
    } 
    historyBtn = document.querySelector('.historyBtn');   
};

const handleAppendSingle = (searchInput) => {
    let buttonDiv = document.createElement("div")
    let buttonEl = document.createElement("button");

    buttonDiv.classList.add("d-grid", "mt-2");

    buttonEl.classList.add("btn", "btn-secondary", "historyBtn");
    buttonEl.dataset.city = searchInput;
    buttonEl.textContent = searchInput;

    if (searchHistory.length >= 8) {
        historyEl.prepend(buttonDiv);
        buttonDiv.prepend(buttonEl);
        // keep max searches at 8 at all times
        historyEl.removeChild(historyEl.lastElementChild);
    }
    else {
        historyEl.append(buttonDiv);
        buttonDiv.append(buttonEl);
    }
}

const handleSearchHistoryClick = (event) => {
   // button clicked
   let clicked = event.target;
   let searchHistoryInput = clicked.dataset.city;
   // if they actually clicked on a button for a past search
   if (searchHistoryInput !== undefined) {
       getCoordinates(searchHistoryInput);
   }
};

const handleSearch = () => {
    // if searchbox is not empty
    let searchInput = document.querySelector('#search-input').value.trim();
    // if user entered a city
    if (searchInput != ""){
        // get the input
        getCoordinates(searchInput);
        // reset input text on search so that it becomes blank again
        input.value = "";
    }
    else {
        alert('You must enter a valid city!')
    }   
};

const getCoordinates = (searchInput) => {
    let lat; 
    let lon;
    let coordinateUrl = "https://api.openweathermap.org/data/2.5/weather?q=" + searchInput + "&appid=" + key;
    // returns the coordinates of city
    fetch(coordinateUrl)
    .then((response) => {
        if (response.status == 404){
            // tell user the city that they typed was not found
            //TODO make this a modal
            alert("No city named " + searchInput + " found.")
            return;
        }
        else {
            return response.json();
        }
    })
    // go into returned object and pull the lat and long, set them to variables
    .then((data) => {
        lat = data.coord.lat;
        lon = data.coord.lon;
        cityName = data.name;

        getWeather(lat, lon);
        searchInput = capitalFormat(searchInput);
        // if the search is already in the search history, don't add it
        if (searchHistory.includes(searchInput)){
            
        }
        // if city is not in the search history, push this search to the array
        else {
            if (searchHistory.length >= 8) {
                // add item to beginning of saved array
                searchHistory.unshift(searchInput);
                // remove last item from array
                searchHistory.pop();
            }
            else {
                // add item to end of saved array
                searchHistory.push(searchInput);
            }
            handleAppendSingle(searchInput);
         }
        // write to local storage
        localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
    }); 
};

const getWeather = (lat, lon) => {
    let weatherUrl = "https://api.openweathermap.org/data/2.5/onecall?lat="
     + lat + "&lon=" + lon + "&units=imperial" + "&exclude=alerts" + "&appid=" + key;

    fetch(weatherUrl)
    .then((response) => {
      if (response.status == 404){
        alert("404 error, page not found, check your input.");
      }
      else {
        return response.json();
      }
    })
    .then((data) => {
      weatherInfo = data;
      fillCurrentData();
    });
};

const fillCurrentData = () => {
    // ****** CURRENT WEATHER ****** //
    let cityWrap = document.querySelector("#city-wrapper");
    let temp = document.querySelector("#temp");
    let feels = document.querySelector("#feels-like");
    let wind = document.querySelector("#wind");
    let humidity = document.querySelector("#humidity");
    let uvIndex = document.querySelector("#uv-index");
    let cityNameEl = document.querySelector(".city");
    let currentIconEl = document.querySelector("#current-icon");
    let currentIconCode = weatherInfo.current.weather[0].icon;
    let iconUrl = "https://openweathermap.org/img/wn/" + currentIconCode + "@2x.png";
    let currentDate = new Date();
    let cDay = currentDate.getDate();
    let cMonth = currentDate.getMonth() + 1;
    let cYear = currentDate.getFullYear();
    // make all weather elements visible
    cityWrap.classList.remove("invisible");
    cityNameEl.textContent = "Today in " + cityName;

    let todayEl = document.createElement("span");

    // use the date function in JS to set current date and append to page
    todayEl.innerHTML = " (" + cMonth + "/" + cDay + "/" + cYear + ")";

    cityNameEl.appendChild(todayEl);

    currentIconEl.setAttribute("src", iconUrl)

    // append current weather info to the page
    let tempData = weatherInfo.current.temp;
    simpleTemp = Math.round(tempData);
    temp.textContent = simpleTemp + "\xB0 F";
    feels.textContent = Math.round(weatherInfo.current.feels_like) + "\xB0 F";
    wind.textContent = Math.round(weatherInfo.current.wind_speed) + " MPH";
    humidity.textContent = weatherInfo.current.humidity + " %";
    uvIndex.textContent = weatherInfo.current.uvi;

    if (weatherInfo.current.uvi < 2) {
        uvIndex.setAttribute("class", "btn-success btn-gradient text-white")
    }
    else if (weatherInfo.current.uvi > 2) {
        uvIndex.setAttribute("class", "bg-warning bg-gradient text-white")
    }
    else {
        uvIndex.setAttribute("class", "bg-danger bg-gradient text-white")
    }
    // 5 day forecast 
    fillForecastData();
}

const fillForecastData = () => {
    let forecastEL = document.querySelector(".forecast-wrapper");

    if (toggle == true){
        // reset 5-day forecast
        for (let i = 0; i < forecastEL.children.length; i++) {
            let dateEl = document.querySelector(".date");
            let iconEl = document.querySelector(".icon");
            let tempEl = document.querySelector(".temp");
            let windEl = document.querySelector(".wind");
            let humidityEl = document.querySelector(".humidity");

            dateEl.remove();
            iconEl.remove();
            tempEl.remove();
            windEl.remove();
            humidityEl.remove();
        }
    }
    for(let i = 0; i < forecastEL.children.length; i++) {
        let tempEl = document.createElement("div");
        let windEl = document.createElement("div");
        let humidityEl = document.createElement("div");
        let iconEl = document.createElement("div");
        let dateEl = document.createElement("div");
        let iconCode = weatherInfo.daily[i+1].weather[0].icon;
        let unixDate = weatherInfo.daily[i+1].dt;
        let iconUrl = "https://openweathermap.org/img/wn/" + iconCode + "@2x.png";

        dateEl.setAttribute("class", "date fw-bold");
        iconEl.setAttribute("class", "icon");
        tempEl.setAttribute("class", "temp");
        windEl.setAttribute("class", "wind");
        humidityEl.setAttribute("class", "humidity");

        if (i == 0){
            dateEl.innerText = "Tomorrow ";
        }
        else {
            dateEl.innerText = timeConverter(unixDate);
        }
        iconEl.innerHTML = '<img src=' + iconUrl + ">";
        tempEl.innerText = "Temp: " + Math.round(weatherInfo.daily[i+1].temp.day) + "\xB0 F";
        windEl.innerText = "Wind: " + Math.round(weatherInfo.daily[i+1].wind_speed) + " MPH";
        humidityEl.innerText = "Humidity: " + Math.round(weatherInfo.daily[i+1].humidity) + " %";
        // make visible and append to page
        forecastEL.classList.remove("invisible");
        forecastEL.children[i].appendChild(dateEl);
        forecastEL.children[i].appendChild(iconEl);
        forecastEL.children[i].appendChild(tempEl);
        forecastEL.children[i].appendChild(windEl);
        forecastEL.children[i].appendChild(humidityEl);
        // signals that the for loop has been run 
        toggle = true;
    }
};

// convert unix timestamp 
const timeConverter = (UNIX_timestamp) => {
    let x = new Date(UNIX_timestamp * 1000);
    let year = x.getFullYear();
    let month = x.getMonth()+1;
    let date = x.getDate();
    let dateFormat= month + '/' + date + '/' + year;
    return dateFormat;
  }
// Get current location from browser
const getCurrentLocation = () => {
    console.log("Requesting device location");
    navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
}
// grab coords from current location if given permission & location is available
const successCallback = (position) => {
    let lat = parseFloat(position.coords.latitude);
    let lon = parseFloat(position.coords.longitude);
    // make lat and long 4 decimals to plug into the API
    lat = lat.toFixed(4);
    lon = lon.toFixed(4);

    useCurrentLocation(lat, lon);
}
// handle errors for get current location
const errorCallback = (error) => {
    let errorDiv = document.querySelector(".error");

    switch(error.code) {
        case error.PERMISSION_DENIED:
          errorDiv.innerHTML = "User denied the request for Geolocation."
          break;
        case error.POSITION_UNAVAILABLE:
          errorDiv.innerHTML = "Location information is unavailable."
          break;
        case error.TIMEOUT:
          errorDiv.innerHTML = "The request to get user location timed out."
          break;
        case error.UNKNOWN_ERROR:
          errorDiv.innerHTML = "An unknown error occurred."
          break;
    }
};

const useCurrentLocation = (lat, lon) => {
    apiUrl = "https://api.openweathermap.org/data/2.5/weather?lat=" + lat + "&lon=" + lon + "&appid=" + key;

    fetch(apiUrl)
  .then((response) => {
    if(response.status == 404){
        // tell user the city that they typed was not found
        alert("No city found.")
        return;
    }
    else {
        return response.json();
    }
  })
  .then((data) => {
    cityName = data.name;
    // pass lat and lon for next api call
    getWeather(lat, lon);
    // add current location to search history
    if(searchHistory.includes(cityName)){
        // do nothing
    }
    else {
        if(searchHistory.length >= 8){
            // add item to beginning of saved array
            searchHistory.unshift(cityName);
            // remove last item from array
            searchHistory.pop();
        }
        else {
            // add item to end of saved array
            searchHistory.push(cityName);
        }
        handleAppendSingle(cityName);
    }
    localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
  });
};

// click button when the user presses the enter key
input.addEventListener("keyup", function(event) {

    if (event.key === 'Enter') {
        event.preventDefault();
        // Trigger the button element with a click
        searchBtn.click();
        input.value = "";
        searchBtn.disabled = true;
    }
    else {
        if (input.value.trim() != "") {
            searchBtn.disabled = false;
        }  
        else {
            searchBtn.disabled = true;
        }
    }
});
// capitalize the first letter of each word
const capitalFormat = (searchInput) => {
    let capitalize = searchInput.split(" ");

    for (let i = 0; i < capitalize.length; i++) {
     capitalize[i] = capitalize[i][0].toUpperCase() + capitalize[i].substr(1);
    }
    return(capitalize.join(' '));
}

const handleClear = () => {
    // clear savedEvent array
    searchHistory = [];
    // save to local storage
    localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
    // refresh page to show changes immediately
    location.reload();
};

searchBtn.addEventListener("click", handleSearch)
clearBtn.addEventListener("click", handleClear)
locateBtn.addEventListener("click", getCurrentLocation)
historyEl.addEventListener("click", handleSearchHistoryClick)
