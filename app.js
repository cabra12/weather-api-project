const submitButton = document.getElementById('submit-button');
const cityInput = document.getElementById('city');

const getCity = () => {
    const city = cityInput.value;
    fetchAPIData(city);
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

    createCard(current, forecast);
};

const createCard = (data) => {
    const div = document.createElement('div');
    div.classList.add('weather-card');
    div.innerHTML = `

    `;

    document.querySelector('.weather-cards-container').appendChild(div);
};

//Event Listeners
submitButton.addEventListener('click', getCity);

