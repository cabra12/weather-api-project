const submitButton = document.getElementById('submit-button');
const input = document.querySelector('#city');
const dropdown = document.getElementById('dropdown');
let debounceTimer;

let rawInput;
let lastQuery;
//variable named this way when user toggles, the "last query" is used in the API

const searchResult = () => {
    const key = 'ea12bceac54c6a464611413684fbe029';

    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(async () => {
        const query = input.value;

        if(query.length < 3) return;

        const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${key}`);
        const cities = await response.json();
        dropDownMenu(cities);
    }, 300);
};

const dropDownMenu = (cities) => {
    dropdown.innerHTML = (cities.slice(0, 5).map((city) => 
        `<div class="search-result">${city.name}, ${city.state}, ${city.country}</div>`
    ).join(''));

    dropdown.style.display = 'block';
};

dropdown.addEventListener('click', (e) => {
    const item = e.target.closest('.search-result');
    if(!item) return;
    const result = item.textContent;
    
    fetchAPIData(result);
});

const fetchAPIData = async (query, units = 'imperial') => {

    lastQuery = query;
    dropdown.innerHTML = '';
    document.getElementById('city').value = '';

    if(document.querySelector('.weather-input-container')) {
        document.querySelector('.weather-input-container').remove();
    }

    const key = 'ea12bceac54c6a464611413684fbe029';
    showLoader();

    const base_API_URL = 'https://api.openweathermap.org/data/2.5';
    const formattedQuery = encodeURIComponent(query); //formats query if user put in spaces for two word city names (ex: Los Angeles)

    try {
        const locationResponse = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${formattedQuery}&limit=1&appid=${key}`);
        if(!locationResponse.ok) throw new Error(`There was an error retrieving the data: ${locationResponse.status}`);

        const locationData = await locationResponse.json();
        if(!locationData.length) throw new Error("Location not found");
        const lat = locationData[0].lat;
        const lon = locationData[0].lon;
        const region = locationData[0].state || locationData[0].country;

        const [currentRes, forecastRes] = await Promise.all([
            fetch(`${base_API_URL}/weather?lat=${lat}&lon=${lon}&appid=${key}&units=${units}`),
            fetch(`${base_API_URL}/forecast?lat=${lat}&lon=${lon}&cnt=40&appid=${key}&units=${units}`),
        ]);

        if(!currentRes.ok) throw new Error(`Finding current weather failed: ${currentRes.status}`);
        if(!forecastRes.ok) throw new Error(`Finding future forecast failed: ${forecastRes.status}`);

        const current = await currentRes.json();
        const forecast = await forecastRes.json();

        const forecastArray = getDailyForecast(forecast);
        createCard(current, forecastArray, region, units);
    } catch (error) {
        console.error('Failed: ', error.message);
        showAlert(error.message);
    } finally {
        hideLoader();
    }

};


const getDay = (dateStr) => {
    const date = new Date(dateStr.replace(/-/g, "/"));
    return date.toLocaleDateString("en-US", { weekday: "short"});
};

const getDailyForecast = (forecast) => {
    const days = {};

    forecast.list.forEach(entry => {
        const date = entry.dt_txt.split(" ")[0];
        
        if(!days[date]) {
            days[date] = {
                day: getDay(date),
                temps_max: [],
                temps_min: [],
                weather: entry.weather[0].main,
                iconID: entry.weather[0].icon,
            }
        }

        //Open weather API gives the times in UTC
        if(entry.dt_txt.includes('19:00:00')) {
            days[date].weather = entry.weather[0].main;
            days[date].iconID = entry.weather[0].icon;
        }

        days[date].temps_max.push(entry.main.temp_max);
        days[date].temps_min.push(entry.main.temp_min);
    });

    return days;
};

const forecastHTML = (forecast) => {
    const firstKey = Object.keys(forecast)[0];
    const firstDay = forecast[firstKey].day;
    const currentDay = getDay(new Date().toLocaleDateString("en-CA"));
    let currentObjForecast;

    currentObjForecast = (firstDay === currentDay ? Object.values(forecast).slice(1) : Object.values(forecast)).slice(0, 5);

    //this was done because the forecast was going from a 5 day forecast to a 4 day or 6 day forecast without this, depending on the time of day

    //this turns all places where it shows a "night" icon to a "day" icon
    Object.keys(currentObjForecast).forEach(date => {
        if(currentObjForecast[date].iconID === '01n') {
            currentObjForecast[date].iconID = '01d';
        }
    });

    return currentObjForecast.map(day =>
        `<div class="forecast-day">
            <span class="day-label">${day.day}</span>
            <img src="icons/${day.iconID}.svg" alt="forecast weather icon">
            <div class="forecast-temps">
                <span>L: ${Math.round(Math.min(...day.temps_min))}&deg; &nbsp;&nbsp; H: ${Math.round(Math.max(...day.temps_max))}&deg;</span>
            </div>
            <div>${day.weather}</div>
        </div>`
    ).join("");
};

const changingTheme = (sunrise, sunset) => {
    //doing the night theme
    const card = document.querySelector('.card');
    const now = Date.now() / 1000; //converts to what the API uses
    const isNight = now < sunrise || now > sunset;
    //takes the time and compares it to the sunset and sunrise of the location, always reflecting the region's day time and night time in the theme

    if(isNight) {
        card.style.background = 'linear-gradient(135deg, #2e4a7a 0%, #3b6494 25%, #4a3f80 65%, #2d2d6b 100%)';
        submitButton.style.background = '#5b7ab8';
        card.style.color = '#fff';
    }else {
        card.style.background = 'linear-gradient(135deg, #e8f4fd 0%, #87ceeb 30%, #3b8fd4 65%, #57aee8 100%)';
        submitButton.style.background = '#2176ae';
        card.style.color = '#000';
    }
};

//changing UI to reflect the units of temperature
const boldTemp = (units) => {
    if(units === 'metric') {
        document.querySelector('.temp-bold-fah').style.fontWeight = '400';
        document.querySelector('.temp-bold-cel').style.fontWeight = '600';
    }else {
        document.querySelector('.temp-bold-fah').style.fontWeight = '600';
        document.querySelector('.temp-bold-cel').style.fontWeight = '400';
    }
}

const createCard = (current, forecast, region, units) => {

    const div = document.createElement('div');
    div.classList.add('weather-input-container');
    div.innerHTML = `
                <div class="top-row">
                    <h2 class="city-name">${current.name}, ${region}</h2>
                    <div class="main-row">
                        <div class="weather-icon-row">
                            <img src="icons/${current.weather[0].icon}.svg" alt="weather icon">
                            <div class="condition">${current.weather[0].main}</div>
                        </div>
                        <div class="temp-items">
                            <div class="temp-degree">
                                <div class="temp-display">${Math.round(current.main.temp)}</div>
                                <div><span class="temp-bold-fah">&deg;F</span> | <span class="temp-bold-cel">&deg;C</span> </div>
                            </div>
                            <div class="weather-data-column">
                                <p>🌡️ Feels Like: ${Math.round(current.main.feels_like)}&deg;</p>
                                <div>🔻 Min: ${Math.round(current.main.temp_min)}&deg; | 🔺 Max: ${Math.round(current.main.temp_max)}&deg;</div> 
                                <p>💧 Humidity: ${current.main.humidity}% | 💨 Wind: ${units === "imperial" ? `${current.wind.speed} mph` : `${current.wind.speed} m/s`}</p>                             
                            </div>
                        </div>
                    </div>
                </div>
                <div class="forecast-row"> ${forecastHTML(forecast)}</div> 
                <div style="text-align: center; margin-top: 1rem;"><p>Data from OpenWeatherMap API</p></div>
    `;
    
    document.querySelector('.card').appendChild(div);
    changingTheme(current.sys.sunrise, current.sys.sunset);
    boldTemp(units);

    
    //Event Listeners for card creation
    document.querySelector('.temp-bold-cel').addEventListener('click', () => fetchAPIData(lastQuery, 'metric'));
    document.querySelector('.temp-bold-fah').addEventListener('click', () => fetchAPIData(lastQuery, 'imperial'));
};

const showLoader = () => {
    document.querySelector('.loader').classList.add('show');
};

const hideLoader = () => {
    document.querySelector('.loader').classList.remove('show');
};

const showAlert = (message) => {
    const wrapper = document.createElement('div');
    wrapper.style.textAlign = 'center';


    const alertEl = document.createElement('p');
    alertEl.classList.add('alert');
    alertEl.textContent = `Query Failed: ${message}`;

    document.querySelector('.card').appendChild(wrapper);
    wrapper.appendChild(alertEl);
    setTimeout(() => wrapper.remove(), 4000);
};


//Event Listeners
document.addEventListener('DOMContentLoaded', fetchAPIData('Los Angeles,CA,US'));
submitButton.addEventListener('click', () => fetchAPIData(document.getElementById('city').value));
input.addEventListener('input', searchResult);


