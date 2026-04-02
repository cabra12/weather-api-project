const submitButton = document.getElementById('submit-button');
const cityInput = document.getElementById('city');

const getCity = () => {
    const city = cityInput.value;
    fetchAPIData(city);
};

const fetchAPIData = async (city) => {
    const key = 'ea12bceac54c6a464611413684fbe029';
    const API_URL = 'https://api.openweathermap.org/data/2.5/weather';
    const response = await fetch(`${API_URL}?q=${city}&appid=${key}&units=imperial`);

    const data = await response.json();
    createCard(data);
};

const createCard = (data) => {
    
};

//Event Listeners
submitButton.addEventListener('click', getCity);

