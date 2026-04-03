//https://openweathermap.org/current?collection=current_forecast#name
//https://openweathermap.org/forecast5?collection=current_forecast#5days

const submitButton = document.getElementById('submit-button');
const cityInput = document.getElementById('city');

const getCity = () => {
    const city = cityInput.value;
    fetchAPIData(city);
    cityInput.value = '';
};

const fetchAPIData = async (city) => {
    const key = 'ea12bceac54c6a464611413684fbe029';
    const base_API_URL = 'https://api.openweathermap.org/data/2.5';

    const locationResponse = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${key}`);
    const locationData= await locationResponse.json();
    const lat = locationData[0].lat;
    const lon = locationData[0].lon;

    const [currentRes, forecastRes] = await Promise.all([
        fetch(`${base_API_URL}/weather?q=${city}&appid=${key}&units=imperial`),
        fetch(`${base_API_URL}/forecast?lat=${lat}&lon=${lon}&cnt=40&appid=${key}&units=imperial`),
    ]);

    const current = await currentRes.json();
    const forecast = await forecastRes.json();

    const forecastArray = getDailyForecast(forecast);

    createCard(current, forecastArray);
    console.log(current);
};

const getDay = (dateStr) => {
    const date = new Date(dateStr.replace(/-/g, "/"));
    return date.toLocaleDateString("en-US", { weekday: "short"});
}

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

const getDyanmicDay = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
};

const forecastHTML = (forecast) => {
    return Object.values(forecast).map(day =>
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

const createCard = (current, forecast) => {

    const div = document.createElement('div');
    div.classList.add('weather-input-container');
    div.innerHTML = `
                <div class="main-row">
                    <div class="city-block">
                        <h2 class="city-name">${current.name}</h2>
                        <div class="condition">${current.weather[0].main} Min: ${Math.round(current.main.temp_min)}°F &nbsp; Max: ${Math.round(current.main.temp_max)}°F </div>
                        <div class="temp-display">${Math.round(current.main.temp)}°F</span></div>
                    </div>
            
                    <div class="weather-icon">
                    </div>
            
                    <div class="details-block">
                        <p>${getDyanmicDay()} ${new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit"})}</p>
                        <p>Humidity: ${current.main.humidity}%</p>
                        <p>Wind: ${current.wind.speed} mi/h</p>
                    </div>
                </div>
                <div class="forecast-row"> ${forecastHTML(forecast)}</div> 
    `;

    document.querySelector('.card').appendChild(div);
};


//Event Listeners
submitButton.addEventListener('click', getCity);

