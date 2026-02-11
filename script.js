   // Update live clock every second
        function updateClock() {
            const now = new Date();
            let hours = now.getHours();
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';

            hours = hours % 12 || 12;
            hours = String(hours).padStart(2, '0');

            document.querySelector('.clock-time-header').textContent = `${hours}:${minutes}:${seconds}`;
            document.querySelector('.clock-ampm-header').textContent = ampm;
        }

        // Update clock immediately and every second
        updateClock();
        setInterval(updateClock, 1000);

        document.getElementById('languageSelector').addEventListener('change', function (e) {
            const lang = e.target.value;
            updateLanguage(lang);
        });

        // Get user's current location and fetch prayer times
        function getPrayerTimes() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        fetchLocationName(latitude, longitude);
                        fetchPrayerTimesAPI(latitude, longitude);
                    },
                    (error) => {
                        console.log('Location access denied, using Lucknow default');
                        displayLocationDate('Lucknow, UP', 26.8467, 80.9462);
                        fetchPrayerTimesAPI(26.8467, 80.9462);
                    }
                );
            } else {
                console.log('Geolocation not supported, using Lucknow default');
                displayLocationDate('Lucknow, UP', 26.8467, 80.9462);
                fetchPrayerTimesAPI(26.8467, 80.9462);
            }
        }

        // Fetch location name from coordinates using reverse geocoding
        function fetchLocationName(latitude, longitude) {
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
                .then(response => response.json())
                .then(data => {
                    const city = data.address.city || data.address.town || data.address.village || 'Unknown Location';
                    const state = data.address.state || '';
                    const locationName = state ? `${city}, ${state}` : city;
                    displayLocationDate(locationName, latitude, longitude);
                })
                .catch(error => {
                    console.log('Could not fetch location name');
                    displayLocationDate('Your Location', latitude, longitude);
                });
        }

        // Display date and location
        function displayLocationDate(locationName, latitude, longitude) {
            const today = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const dateString = today.toLocaleDateString('en-US', options);

            document.getElementById('locationDate').innerHTML =
                `📍 ${locationName} | 📅 ${dateString}`;
        }

        // Fetch prayer times from Aladhan API (free, no key needed)
        function fetchPrayerTimesAPI(latitude, longitude) {
            const today = new Date();
            const date = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;

            fetch(`https://api.aladhan.com/v1/timings/${date}?latitude=${latitude}&longitude=${longitude}&method=2`)
                .then(response => response.json())
                .then(data => {
                    if (data.code === 200) {
                        displayPrayerTimes(data.data.timings);
                    }
                })
                .catch(error => {
                    console.error('Error fetching prayer times:', error);
                    displayPrayerTimes({
                        Fajr: '05:30',
                        Dhuhr: '12:30',
                        Asr: '16:45',
                        Maghrib: '18:45',
                        Isha: '20:15'
                    });
                });
        }

        function displayPrayerTimes(timings) {

            const prayers = [
                { name: 'Fajr', time: timings.Fajr },
                { name: 'Zuhr', time: timings.Dhuhr },
                { name: 'Asr', time: timings.Asr },
                { name: 'Maghrib', time: timings.Maghrib },
                { name: 'Isha', time: timings.Isha }
            ];

            const container = document.getElementById('prayerTimesContainer');
            container.innerHTML = '';

            const now = new Date();
            let nextPrayerFound = false;
            let prayerElements = [];

            prayers.forEach((prayer) => {

                const prayerTime = new Date();
                const [hours, minutes] = prayer.time.split(':');

                prayerTime.setHours(parseInt(hours), parseInt(minutes), 0);

                const isPastPrayer = now > prayerTime;
                const isNextPrayer = !isPastPrayer && !nextPrayerFound;

                if (isNextPrayer) nextPrayerFound = true;

                const prayerDiv = document.createElement('div');
                prayerDiv.className = `prayer-item ${isNextPrayer ? 'next' : ''}`;

                prayerDiv.innerHTML = `
            <div class="prayer-name">${prayer.name}</div>
            <div class="prayer-time">${prayer.time}</div>
        `;

                container.appendChild(prayerDiv);
                prayerElements.push(prayerDiv);
            });

            /* ⭐ FIX: if all prayers passed → highlight Fajr */
            if (!nextPrayerFound && prayerElements.length > 0) {
                prayerElements[0].classList.add("next");
            }

            /* Status text */
            const statusText = document.getElementById('prayerStatus');

            const nextPrayer = prayers.find(p => {
                const pt = new Date();
                const [h, m] = p.time.split(':');
                pt.setHours(parseInt(h), parseInt(m), 0);
                return now <= pt;
            });

            if (nextPrayer) {
                statusText.textContent = `Next Prayer: ${nextPrayer.name} at ${nextPrayer.time}`;
            } else {
                statusText.textContent = `Next Prayer: Fajr at ${prayers[0].time}`;
            }
        }


        // Load prayer times on page load
        window.addEventListener('load', getPrayerTimes);
