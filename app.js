//https://openweathermap.org/weather-conditions <------icons
//https://openweathermap.org/forecast5?collection=current_forecast#5days

const submitButton = document.getElementById('submit-button');
const rawInput = document.getElementById('city');

const getLocation = () => {
    const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];
    const parts = rawInput.value.split(",").map(str => str.trim());
    const lastPart = parts[parts.length - 1].toUpperCase();
    const isUSState = US_STATES.includes(lastPart);
    const isCountryCode = parts.length === 3 || (!isUSState && parts.length === 2);
    const query = isCountryCode ? parts.join(",") : `${parts.join(",")},US`;
    console.log(query);
    
    if(document.querySelector('.weather-input-container')) {
        document.querySelector('.weather-input-container').remove();
    }
    fetchAPIData(query);
    rawInput.value = '';
};

const fetchAPIData = async (query) => {
    const key = 'ea12bceac54c6a464611413684fbe029';
    const base_API_URL = 'https://api.openweathermap.org/data/2.5';
    const formattedQuery = encodeURIComponent(query);

    const locationResponse = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${formattedQuery}&limit=1&appid=${key}`);
    const locationData = await locationResponse.json();
    const lat = locationData[0].lat;
    const lon = locationData[0].lon;
    const region = locationData[0].state || locationData[0].country;

    const [currentRes, forecastRes] = await Promise.all([
        fetch(`${base_API_URL}/weather?lat=${lat}&lon=${lon}&appid=${key}&units=imperial`),
        fetch(`${base_API_URL}/forecast?lat=${lat}&lon=${lon}&cnt=40&appid=${key}&units=imperial`),
    ]);

    const current = await currentRes.json();
    const forecast = await forecastRes.json();

    const forecastArray = getDailyForecast(forecast);

    createCard(current, forecastArray, region);
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
            }
        }

        if(entry.dt_txt.includes('12:00:00')) {
            days[date].weather = entry.weather[0].main;
        }

        days[date].temps_max.push(entry.main.temp_max);
        days[date].temps_min.push(entry.main.temp_min);
    });

    return days;
};

const forecastHTML = (forecast) => {
    return Object.values(forecast).slice(1).map(day =>
        `<div class="forecast-day">
            <span class="day-label">${day.day}</span>
            <div class="forecast-icon"><!-- img --></div>
            <div class="forecast-temps">
                <span class="lo">${Math.round(Math.min(...day.temps_min))}&deg;</span>
                <span class="hi">${Math.round(Math.max(...day.temps_max))}&deg;</span> 
            </div>
        </div>`
    ).join("");
};

const createCard = (current, forecast, region) => {

    const div = document.createElement('div');
    div.classList.add('weather-input-container');
    div.innerHTML = `
                <div class="top-row">
                    <h2 class="city-name">${current.name}, ${region}</h2>
                    <div class="main-row">
                        <div class="weather-icon-row">
                            <img src="weather-icons/clear-svg.svg">
                            <div class="condition">${current.weather[0].main}</div>
                        </div>
                        <div class="temp-items">
                            <div class="temp-display">${Math.round(current.main.temp)}°F</span></div>
                            <div>
                                <p>🌡️ Feels Like: ${Math.round(current.main.feels_like)}°F</p>
                                <div>🔻 Min: ${Math.round(current.main.temp_min)}°F | 🔺 Max: ${Math.round(current.main.temp_max)}°F</div> 
                                <p>💧 Humidity: ${current.main.humidity}% &middot | 💨 Wind: ${current.wind.speed} mi/h</p>                             
                            </div>
                        </div>
                    </div>
                </div>
                <div class="forecast-row"> ${forecastHTML(forecast)}</div> 
    `;

    document.querySelector('.card').appendChild(div);
};


//Event Listeners
document.addEventListener('DOMContentLoaded', fetchAPIData('Los Angeles,CA,US'));
submitButton.addEventListener('click', getLocation);

