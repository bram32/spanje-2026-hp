/**
 * =============================================================================
 * MARBELLA TRIP 2026 - MAIN JAVASCRIPT FILE
 * =============================================================================
 *
 * This file contains all the interactive functionality for the website.
 * JavaScript makes your website "come alive" with dynamic features.
 *
 * TABLE OF CONTENTS:
 * ------------------
 * 1. Video Loop Controls (for gallery videos)
 * 2. Highlight Card Hover Effects
 * 3. Venue Card Hover Effects
 * 4. BBQ Steak Game
 * 5. Countdown Timer
 * 6. Smooth Scrolling
 * 7. Music Player
 * 8. Initialization
 *
 * =============================================================================
 */


/* =============================================================================
   1. VIDEO LOOP CONTROLS
   =============================================================================

   These functions control the video loops in the gallery section.
   They make videos play only a specific portion (e.g., seconds 6-11).

   How it works:
   - 'loadedmetadata' event fires when video info is loaded
   - 'timeupdate' event fires constantly while video plays
   - We check the current time and reset it when it reaches our end point
*/

/**
 * Sets up a video to loop between specific start and end times
 *
 * @param {string} videoId - The HTML id of the video element
 * @param {number} startTime - When to start playing (in seconds)
 * @param {number} endTime - When to loop back to start (in seconds)
 */
function setupVideoLoop(videoId, startTime, endTime) {
    // Find the video element by its ID
    const video = document.getElementById(videoId);

    // If video doesn't exist, exit early (prevents errors)
    if (!video) return;

    // When video data is loaded, jump to our start time
    video.addEventListener('loadedmetadata', function() {
        video.currentTime = startTime;
    });

    // Continuously check the time while playing
    video.addEventListener('timeupdate', function() {
        // If we've reached the end time, go back to start
        if (video.currentTime >= endTime) {
            video.currentTime = startTime;
        }
    });
}


/* =============================================================================
   2. HIGHLIGHT CARD HOVER EFFECTS
   =============================================================================

   These functions make images/videos appear when you hover over highlight cards.

   How it works:
   - 'mouseenter' event fires when mouse moves onto an element
   - 'mouseleave' event fires when mouse moves away
   - We change the 'opacity' CSS property to show/hide the media
*/

/**
 * Sets up hover effect for highlight cards with images
 *
 * @param {HTMLElement} card - The card element
 */
function setupImageHoverEffect(card) {
    // Find the image inside this card
    const img = card.querySelector('img');

    // If no image found, exit
    if (!img) return;

    // Show image when mouse enters
    card.addEventListener('mouseenter', function() {
        img.style.opacity = '1';
    });

    // Hide image when mouse leaves
    card.addEventListener('mouseleave', function() {
        img.style.opacity = '0';
    });
}

/**
 * Sets up hover effect for highlight cards with videos
 *
 * @param {HTMLElement} card - The card element
 */
function setupVideoHoverEffect(card) {
    // Find the video inside this card
    const video = card.querySelector('video');

    // If no video found, exit
    if (!video) return;

    // Show and play video when mouse enters
    card.addEventListener('mouseenter', function() {
        video.style.opacity = '1';
        video.play();  // Start playing the video
    });

    // Hide and reset video when mouse leaves
    card.addEventListener('mouseleave', function() {
        video.style.opacity = '0';
        video.pause();          // Stop playing
        video.currentTime = 0;  // Reset to beginning
    });
}


/* =============================================================================
   3. VENUE CARD HOVER EFFECTS
   =============================================================================

   Similar to highlight cards, but specifically for venue cards (beach clubs, etc.)
*/

/**
 * Sets up all venue card hover effects
 * This finds all venue cards and adds the appropriate hover behavior
 */
function setupVenueCardHoverEffects() {
    // Find all elements with class 'venue-card'
    const venueCards = document.querySelectorAll('.venue-card');

    // Loop through each card
    venueCards.forEach(function(card) {
        // Check for hover image
        const img = card.querySelector('.venue-hover-img');
        if (img) {
            card.addEventListener('mouseenter', function() {
                img.style.opacity = '1';
            });
            card.addEventListener('mouseleave', function() {
                img.style.opacity = '0';
            });
        }

        // Check for hover video
        const video = card.querySelector('.venue-hover-video');
        if (video) {
            card.addEventListener('mouseenter', function() {
                video.style.opacity = '1';
                video.play();
            });
            card.addEventListener('mouseleave', function() {
                video.style.opacity = '0';
                video.pause();
                video.currentTime = 0;
            });
        }
    });
}


/* =============================================================================
   4. BBQ STEAK GAME
   =============================================================================

   An interactive mini-game where you cook a virtual steak.

   Game States:
   - 'ready': Waiting to start
   - 'cooking': First side is cooking
   - 'flipped': Second side is cooking
   - 'done': Game finished, showing score

   The player clicks to:
   1. Start cooking
   2. Flip the steak
   3. Take it off the grill
*/

// Game state variables (stored globally so all functions can access them)
let steakGame = {
    state: 'ready',           // Current game state
    cookTime: 0,              // Total cooking time in seconds
    side1Time: 0,             // Time spent on first side
    side2Time: 0,             // Time spent on second side
    cookInterval: null,       // Reference to the timer
    targetDoneness: 'medium', // What the player is trying to achieve

    // Cooking time ranges for each doneness level (in percentage of max)
    targetRanges: {
        'rare':        { min: 15, max: 25, pos: 20 },
        'medium-rare': { min: 25, max: 40, pos: 40 },
        'medium':      { min: 40, max: 55, pos: 55 },
        'well-done':   { min: 55, max: 75, pos: 75 }
    }
};

/**
 * Sets the target doneness level
 * Called when player clicks a doneness button
 *
 * @param {string} level - The doneness level (rare, medium-rare, medium, well-done)
 */
function setTarget(level) {
    steakGame.targetDoneness = level;

    // Update button styles - reset all buttons first
    document.querySelectorAll('.doneness-btn').forEach(function(btn) {
        btn.style.background = 'transparent';
        btn.style.color = btn.style.borderColor;
    });

    // Highlight the selected button
    const selected = document.querySelector('[data-level="' + level + '"]');
    if (selected) {
        selected.style.background = selected.style.borderColor;
        selected.style.color = '#000';
    }

    // Move the target marker on the doneness meter
    const marker = document.getElementById('targetMarker');
    if (marker) {
        marker.style.left = steakGame.targetRanges[level].pos + '%';
    }
}

/**
 * Handles click on the grill area
 * Different action depending on current game state
 */
function handleSteakClick() {
    switch(steakGame.state) {
        case 'ready':
            startCooking();
            break;
        case 'cooking':
            flipSteak();
            break;
        case 'flipped':
            finishCooking();
            break;
    }
}

/**
 * Starts the cooking process
 */
function startCooking() {
    steakGame.state = 'cooking';
    steakGame.cookTime = 0;
    steakGame.side1Time = 0;

    // Show game elements
    const flames = document.getElementById('flames');
    const cookTimer = document.getElementById('cookTimer');
    const currentMarker = document.getElementById('currentMarker');
    const flipIndicator = document.getElementById('flipIndicator');
    const gameStatus = document.getElementById('gameStatus');
    const steak = document.getElementById('steak');

    if (flames) flames.style.display = 'block';
    if (cookTimer) cookTimer.style.display = 'block';
    if (currentMarker) currentMarker.style.display = 'block';
    if (flipIndicator) flipIndicator.style.display = 'block';
    if (gameStatus) gameStatus.textContent = 'Klik om te flippen!';
    if (steak) steak.style.animation = 'sizzle 0.1s infinite';

    // Start the cooking timer (runs every 100ms = 0.1 seconds)
    steakGame.cookInterval = setInterval(function() {
        steakGame.cookTime += 0.1;
        steakGame.side1Time += 0.1;
        updateSteakDisplay();
    }, 100);
}

/**
 * Flips the steak to the other side
 */
function flipSteak() {
    steakGame.state = 'flipped';
    steakGame.side1Time = steakGame.cookTime;

    // Update UI
    const gameStatus = document.getElementById('gameStatus');
    const flipIndicator = document.getElementById('flipIndicator');
    const steak = document.getElementById('steak');

    if (gameStatus) gameStatus.textContent = 'Klik als hij klaar is!';
    if (flipIndicator) flipIndicator.innerHTML = '✋';

    // Visual flip animation
    if (steak) {
        steak.style.transform = 'translate(-50%, -50%) scaleX(-1)';
        setTimeout(function() {
            steak.style.transform = 'translate(-50%, -50%) scaleX(1)';
        }, 150);
    }
}

/**
 * Finishes cooking and calculates score
 */
function finishCooking() {
    steakGame.state = 'done';

    // Stop the cooking timer
    clearInterval(steakGame.cookInterval);

    steakGame.side2Time = steakGame.cookTime - steakGame.side1Time;

    // Hide cooking elements
    const flames = document.getElementById('flames');
    const flipIndicator = document.getElementById('flipIndicator');
    const steak = document.getElementById('steak');

    if (flames) flames.style.display = 'none';
    if (flipIndicator) flipIndicator.style.display = 'none';
    if (steak) steak.style.animation = 'none';

    calculateSteakScore();
}

/**
 * Updates the game display (timer, steak color, progress marker)
 */
function updateSteakDisplay() {
    // Update timer text
    const cookTimer = document.getElementById('cookTimer');
    if (cookTimer) {
        cookTimer.textContent = steakGame.cookTime.toFixed(1) + 's';
    }

    // Calculate total cooking progress
    const totalCook = steakGame.side1Time +
        (steakGame.state === 'flipped' ? (steakGame.cookTime - steakGame.side1Time) : 0);
    const percentage = Math.min((totalCook / 80) * 100, 100);

    // Update progress marker position
    const currentMarker = document.getElementById('currentMarker');
    if (currentMarker) {
        currentMarker.style.left = percentage + '%';
    }

    // Update steak color based on how cooked it is
    const steakShape = document.getElementById('steakShape');
    if (steakShape) {
        if (percentage < 20) {
            steakShape.setAttribute('fill', '#dc143c');       // Raw red
        } else if (percentage < 40) {
            steakShape.setAttribute('fill', '#c41e3a');       // Rare
        } else if (percentage < 55) {
            steakShape.setAttribute('fill', '#a0522d');       // Medium
        } else if (percentage < 75) {
            steakShape.setAttribute('fill', '#8b4513');       // Well done
        } else {
            steakShape.setAttribute('fill', '#3d2314');       // Burnt
        }
    }
}

/**
 * Calculates the player's score based on how close to target doneness
 */
function calculateSteakScore() {
    const target = steakGame.targetRanges[steakGame.targetDoneness];
    const percentage = (steakGame.cookTime / 80) * 100;
    const diff = Math.abs(percentage - target.pos);

    // Get UI elements
    const scoreDisplay = document.getElementById('scoreDisplay');
    const scoreTitle = document.getElementById('scoreTitle');
    const scoreText = document.getElementById('scoreText');
    const gameStatus = document.getElementById('gameStatus');

    if (scoreDisplay) scoreDisplay.style.display = 'block';
    if (gameStatus) gameStatus.textContent = 'Klaar!';

    // Determine score message based on accuracy
    if (diff < 5) {
        // Perfect!
        if (scoreTitle) {
            scoreTitle.textContent = '🏆 PERFECT!';
            scoreTitle.style.color = '#f4d03f';
        }
        if (scoreText) {
            scoreText.textContent = 'Je bent een echte BBQ Master! De jongens zijn trots.';
        }
    } else if (diff < 15) {
        // Good
        if (scoreTitle) {
            scoreTitle.textContent = '👍 Goed gedaan!';
            scoreTitle.style.color = '#2ecc71';
        }
        if (scoreText) {
            scoreText.textContent = 'Prima steak! Bijna perfect, maar nog steeds lekker.';
        }
    } else if (diff < 25) {
        // Okay
        if (scoreTitle) {
            scoreTitle.textContent = '😅 Oké...';
            scoreTitle.style.color = '#e67e22';
        }
        if (scoreText) {
            scoreText.textContent = 'Eetbaar, maar je kunt beter. Oefen nog even!';
        }
    } else {
        // Failed - burnt or too raw
        if (scoreTitle) {
            scoreTitle.textContent = percentage > 80 ? '🔥 Verbrand!' : '🥶 Te rauw!';
            scoreTitle.style.color = '#e74c3c';
        }
        if (scoreText) {
            scoreText.textContent = percentage > 80 ?
                'Deze steak is naar de haaien. Probeer opnieuw!' :
                'Dit is nog geen steak, dit is carpaccio!';
        }
    }
}

/**
 * Resets the game to play again
 */
function resetSteakGame() {
    steakGame.state = 'ready';
    steakGame.cookTime = 0;
    steakGame.side1Time = 0;
    steakGame.side2Time = 0;

    // Reset UI elements
    const cookTimer = document.getElementById('cookTimer');
    const currentMarker = document.getElementById('currentMarker');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const flipIndicator = document.getElementById('flipIndicator');
    const gameStatus = document.getElementById('gameStatus');
    const steakShape = document.getElementById('steakShape');
    const steak = document.getElementById('steak');

    if (cookTimer) cookTimer.style.display = 'none';
    if (currentMarker) {
        currentMarker.style.display = 'none';
        currentMarker.style.left = '0%';
    }
    if (scoreDisplay) scoreDisplay.style.display = 'none';
    if (flipIndicator) {
        flipIndicator.style.display = 'none';
        flipIndicator.innerHTML = '🔄';
    }
    if (gameStatus) gameStatus.textContent = 'Klik om te starten!';
    if (steakShape) steakShape.setAttribute('fill', '#dc143c');
    if (steak) steak.style.transform = 'translate(-50%, -50%)';
}


/* =============================================================================
   5. COUNTDOWN TIMER
   =============================================================================

   Calculates and displays time remaining until the trip date.

   How it works:
   - Get the target date (April 9, 2026 at 5:00 AM)
   - Get current date/time
   - Calculate the difference in milliseconds
   - Convert to days, hours, minutes, seconds
   - Update the display
   - Run every second (1000ms)
*/

/**
 * Updates the countdown display
 * Called every second by setInterval
 */
function updateCountdown() {
    // Target date: April 9, 2026 at 5:00 AM
    const tripDate = new Date('2026-04-09T05:00:00');

    // Current date/time
    const now = new Date();

    // Difference in milliseconds
    const diff = tripDate - now;

    // Only update if the date is in the future
    if (diff > 0) {
        // Convert milliseconds to days, hours, minutes, seconds
        // Math.floor() rounds down to nearest whole number
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        // Update the HTML elements
        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const secondsEl = document.getElementById('seconds');

        if (daysEl) daysEl.textContent = days;
        if (hoursEl) hoursEl.textContent = hours;
        if (minutesEl) minutesEl.textContent = minutes;
        if (secondsEl) secondsEl.textContent = seconds;
    }
}


/* =============================================================================
   6. SMOOTH SCROLLING
   =============================================================================

   Makes anchor links (like <a href="#section">) scroll smoothly
   instead of jumping instantly.
*/

/**
 * Sets up smooth scrolling for all anchor links
 */
function setupSmoothScrolling() {
    // Find all links that start with #
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            // Prevent the default jump behavior
            e.preventDefault();

            // Get the target element
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            // Scroll to it smoothly
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
}


/* =============================================================================
   7. MUSIC PLAYER
   =============================================================================

   Controls the background music with a toggle button.
*/

// Music player state
let musicPlayer = {
    isPlaying: false,
    audio: null,
    button: null
};

/**
 * Toggles the music on/off
 */
function toggleMusic() {
    musicPlayer.audio = musicPlayer.audio || document.getElementById('bgMusic');
    musicPlayer.button = musicPlayer.button || document.getElementById('musicBtn');

    if (!musicPlayer.audio || !musicPlayer.button) return;

    if (musicPlayer.isPlaying) {
        // Pause the music
        musicPlayer.audio.pause();
        musicPlayer.button.textContent = '🎸';
        musicPlayer.button.classList.remove('playing');
    } else {
        // Play the music
        musicPlayer.audio.volume = 0.3;  // Set volume to 30%

        // play() returns a Promise, we catch any errors
        // (browsers block autoplay, so this might fail)
        musicPlayer.audio.play().catch(function(e) {
            console.log('Autoplay blocked by browser');
        });

        musicPlayer.button.textContent = '🔊';
        musicPlayer.button.classList.add('playing');
    }

    musicPlayer.isPlaying = !musicPlayer.isPlaying;
}


/* =============================================================================
   8. INITIALIZATION
   =============================================================================

   This code runs when the page finishes loading.
   It sets up all the interactive features.

   DOMContentLoaded fires when HTML is fully parsed (before images load).
   This is usually better than 'load' which waits for everything.
*/

document.addEventListener('DOMContentLoaded', function() {
    console.log('🌴 Marbella Trip 2026 website loaded!');

    // --- Set up video loops for gallery videos ---
    setupVideoLoop('epicNightVideo', 6, 11);
    setupVideoLoop('golfVideo', 19, 27);  // Shortened by 1/3 (was 19-31, now 19-27)

    // --- Set up hover effects for highlight cards ---
    // Find highlight cards with images
    document.querySelectorAll('.highlight-card').forEach(function(card) {
        const img = card.querySelector('img');
        const video = card.querySelector('video');

        if (img) {
            setupImageHoverEffect(card);
        }
        if (video) {
            setupVideoHoverEffect(card);
        }
    });

    // --- Set up venue card hover effects ---
    setupVenueCardHoverEffects();

    // --- Initialize the steak game ---
    setTarget('medium');

    // Add click handler to grill area
    const grillArea = document.getElementById('grillArea');
    if (grillArea) {
        grillArea.addEventListener('click', handleSteakClick);
    }

    // --- Start the countdown timer ---
    updateCountdown();
    setInterval(updateCountdown, 1000);  // Update every second

    // --- Set up smooth scrolling ---
    setupSmoothScrolling();

    // --- Set up music button ---
    const musicBtn = document.getElementById('musicBtn');
    if (musicBtn) {
        musicBtn.addEventListener('click', toggleMusic);
    }
});


/* =============================================================================
   9. GAME TAB SWITCHING
   =============================================================================

   Allows switching between different minigames using tabs.
   Only one game is visible at a time.
*/

/**
 * Switches between different minigames
 * Hides all games, then shows the selected one
 *
 * @param {string} game - The game to show ('steak', 'parachute', or 'hakken')
 */
function switchGame(game) {
    // Get all game containers
    const steakGame = document.getElementById('steakGame');
    const parachuteGame = document.getElementById('parachuteGame');
    const hakkenGame = document.getElementById('hakkenGame');

    // Get all tab buttons
    const tabs = document.querySelectorAll('.game-tab');

    // Hide all games first
    if (steakGame) steakGame.style.display = 'none';
    if (parachuteGame) parachuteGame.style.display = 'none';
    if (hakkenGame) hakkenGame.style.display = 'none';

    // Remove 'active' class from all tabs
    tabs.forEach(function(tab) {
        tab.classList.remove('active');
    });

    // Show the selected game and activate its tab
    switch(game) {
        case 'steak':
            if (steakGame) steakGame.style.display = 'block';
            break;
        case 'parachute':
            if (parachuteGame) parachuteGame.style.display = 'block';
            // Initialize parachute game if not started
            if (parachute.state === 'ready') {
                resetParachuteGame();
            }
            break;
        case 'hakken':
            if (hakkenGame) hakkenGame.style.display = 'block';
            break;
    }

    // Find and activate the clicked tab
    // We use data attribute to match the game
    tabs.forEach(function(tab) {
        if (tab.getAttribute('onclick') && tab.getAttribute('onclick').includes(game)) {
            tab.classList.add('active');
        }
    });
}


/* =============================================================================
   10. PAARS PARACHUTEREN GAME (Purple Parachute Landing)
   =============================================================================

   A landing game where you control a purple parachute shaped like a ballsack
   and try to land on a villa on the Marbella beachfront.

   Controls:
   - Arrow keys (left/right) or A/D to move horizontally
   - The parachute slowly descends automatically
   - Wind affects your movement

   Goal:
   - Land precisely on the target villa for maximum points
*/

// Parachute game state
let parachute = {
    state: 'ready',          // 'ready', 'falling', 'landed'
    x: 50,                   // Horizontal position (percentage)
    y: 0,                    // Vertical position (percentage from top)
    fallSpeed: 0.08,         // How fast the parachute falls (slower for better aiming!)
    moveSpeed: 1.5,          // How fast you can move left/right
    wind: 0,                 // Current wind force (-1 to 1)
    windChangeTimer: 0,      // Timer for wind direction changes
    targetX: 65,             // Target villa position (percentage)
    targetWidth: 15,         // Target landing zone width
    gameLoop: null,          // Reference to game animation
    score: 0,                // Player's score
    moveDirection: 0         // -1 = left, 0 = none, 1 = right
};

/**
 * Starts or restarts the parachute game
 */
function resetParachuteGame() {
    // Reset game state
    parachute.state = 'falling';
    parachute.x = 50;
    parachute.y = 5;
    parachute.wind = (Math.random() - 0.5) * 0.5;  // Random initial wind
    parachute.windChangeTimer = 0;
    parachute.moveDirection = 0;

    // Reset UI
    const parachuteEl = document.getElementById('parachutePlayer');
    const scoreDisplay = document.getElementById('parachuteScore');
    const statusDisplay = document.getElementById('parachuteStatus');

    if (parachuteEl) {
        parachuteEl.style.left = parachute.x + '%';
        parachuteEl.style.top = parachute.y + '%';
        parachuteEl.style.display = 'block';
    }
    if (scoreDisplay) scoreDisplay.style.display = 'none';
    if (statusDisplay) statusDisplay.textContent = 'Gebruik ← → of A/D om te sturen!';

    // Update wind indicator
    updateWindIndicator();

    // Stop existing game loop if running
    if (parachute.gameLoop) {
        cancelAnimationFrame(parachute.gameLoop);
    }

    // Start the game loop
    parachuteGameLoop();
}

/**
 * Main game loop for the parachute game
 * Uses requestAnimationFrame for smooth animation
 */
function parachuteGameLoop() {
    if (parachute.state !== 'falling') return;

    // Apply wind and player movement
    parachute.x += parachute.wind + (parachute.moveDirection * parachute.moveSpeed * 0.1);

    // Keep within bounds (5% to 95%)
    parachute.x = Math.max(5, Math.min(95, parachute.x));

    // Fall down
    parachute.y += parachute.fallSpeed;

    // Change wind periodically
    parachute.windChangeTimer++;
    if (parachute.windChangeTimer > 60) {  // Every ~1 second at 60fps
        parachute.windChangeTimer = 0;
        // Smoothly change wind
        parachute.wind += (Math.random() - 0.5) * 0.3;
        parachute.wind = Math.max(-0.8, Math.min(0.8, parachute.wind));
        updateWindIndicator();
    }

    // Update parachute position on screen
    const parachuteEl = document.getElementById('parachutePlayer');
    if (parachuteEl) {
        parachuteEl.style.left = parachute.x + '%';
        parachuteEl.style.top = parachute.y + '%';
    }

    // Check if landed (reached bottom ~85%)
    if (parachute.y >= 75) {
        landParachute();
        return;
    }

    // Continue game loop
    parachute.gameLoop = requestAnimationFrame(parachuteGameLoop);
}

/**
 * Updates the wind direction indicator
 */
function updateWindIndicator() {
    const indicator = document.getElementById('windIndicator');
    if (!indicator) return;

    let windText = 'Wind: ';
    if (parachute.wind < -0.3) {
        windText += '← ← Sterk links';
    } else if (parachute.wind < -0.1) {
        windText += '← Links';
    } else if (parachute.wind > 0.3) {
        windText += 'Sterk rechts → →';
    } else if (parachute.wind > 0.1) {
        windText += 'Rechts →';
    } else {
        windText += 'Kalm';
    }
    indicator.textContent = windText;
}

/**
 * Handles landing - calculates score based on accuracy
 */
function landParachute() {
    parachute.state = 'landed';

    // Calculate distance from target
    const targetCenter = parachute.targetX;
    const distance = Math.abs(parachute.x - targetCenter);

    // Score based on accuracy
    let score, title, message;

    if (distance < 5) {
        // Perfect landing!
        score = 1000;
        title = '🏆 PERFECTE LANDING!';
        message = 'Je bent precies op de villa geland! Welkom in Marbella!';
    } else if (distance < 10) {
        // Great
        score = 750;
        title = '🎉 Geweldig!';
        message = 'Bijna perfect! Je bent in de tuin geland.';
    } else if (distance < 20) {
        // Good
        score = 500;
        title = '👍 Goed gedaan!';
        message = 'Je bent veilig geland, maar niet op de villa.';
    } else if (distance < 35) {
        // Okay
        score = 250;
        title = '😅 Oké...';
        message = 'Je bent in de buurt... soort van.';
    } else {
        // Missed badly
        score = 50;
        title = '🌊 Splash!';
        message = 'Je bent in zee geland! De paarse ballen zijn nat.';
    }

    parachute.score = score;

    // Update UI
    const scoreDisplay = document.getElementById('parachuteScore');
    const statusDisplay = document.getElementById('parachuteStatus');

    if (statusDisplay) statusDisplay.textContent = title;
    if (scoreDisplay) {
        scoreDisplay.style.display = 'block';
        scoreDisplay.innerHTML = '<div style="font-size: 2em; color: #f4d03f;">' + score + ' punten</div>' +
            '<div style="margin-top: 10px;">' + message + '</div>' +
            '<button onclick="resetParachuteGame()" style="margin-top: 15px; padding: 10px 20px; background: #9b59b6; border: none; color: white; border-radius: 10px; cursor: pointer; font-size: 1em;">🪂 Opnieuw!</button>';
    }
}

/**
 * Handles keyboard input for parachute game
 */
function handleParachuteKeyDown(e) {
    if (parachute.state !== 'falling') return;

    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        parachute.moveDirection = -1;
        e.preventDefault();
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        parachute.moveDirection = 1;
        e.preventDefault();
    }
}

function handleParachuteKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' ||
        e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        parachute.moveDirection = 0;
    }
}

/**
 * Handles touch controls for parachute game on mobile
 */
function handleParachuteTouchStart(e) {
    if (parachute.state !== 'falling') return;

    const touch = e.touches[0];
    const gameArea = document.getElementById('parachuteArea');
    if (!gameArea) return;

    const rect = gameArea.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const centerX = rect.width / 2;

    // Left half = move left, right half = move right
    if (touchX < centerX) {
        parachute.moveDirection = -1;
    } else {
        parachute.moveDirection = 1;
    }
    e.preventDefault();
}

function handleParachuteTouchEnd(e) {
    parachute.moveDirection = 0;
}

/**
 * Sets up mobile touch controls for parachute game
 */
function setupParachuteMobileControls() {
    const gameArea = document.getElementById('parachuteArea');
    if (gameArea) {
        gameArea.addEventListener('touchstart', handleParachuteTouchStart, { passive: false });
        gameArea.addEventListener('touchend', handleParachuteTouchEnd);
        gameArea.addEventListener('touchcancel', handleParachuteTouchEnd);
    }

    // Also add touch support to the control buttons
    const leftBtn = document.getElementById('parachuteLeftBtn');
    const rightBtn = document.getElementById('parachuteRightBtn');

    if (leftBtn) {
        leftBtn.addEventListener('touchstart', function(e) {
            if (parachute.state === 'falling') {
                parachute.moveDirection = -1;
                e.preventDefault();
            }
        }, { passive: false });
        leftBtn.addEventListener('touchend', function() { parachute.moveDirection = 0; });
    }

    if (rightBtn) {
        rightBtn.addEventListener('touchstart', function(e) {
            if (parachute.state === 'falling') {
                parachute.moveDirection = 1;
                e.preventDefault();
            }
        }, { passive: false });
        rightBtn.addEventListener('touchend', function() { parachute.moveDirection = 0; });
    }
}


/* =============================================================================
   11. HAKKEN GAME (Gabber Dancing)
   =============================================================================

   A rhythm game where Pascal dances to 90s Dutch gabber music.
   Press the correct keys in time with the beat to score points!

   Controls:
   - A, S, D, F keys correspond to dance moves
   - Hit the keys when the arrows reach the target zone

   The character Pascal wears a "The Stillery" t-shirt from Amsterdam
   and performs classic hakken (gabber dance) moves.
*/

// Hakken game state
let hakken = {
    state: 'ready',          // 'ready', 'playing', 'finished'
    score: 0,
    combo: 0,
    maxCombo: 0,
    bpm: 80,                 // Beats per minute (slower = easier!)
    gameLoop: null,
    notes: [],               // Upcoming notes to hit
    noteSpeed: 1.5,          // How fast notes move down (slower = easier!)
    spawnTimer: 0,
    gameDuration: 30,        // Game length in seconds
    timeRemaining: 30,
    isAnimating: false
};

// Available dance moves (keys and their positions)
const hakkenMoves = {
    'a': { lane: 0, name: 'Links Stamp', color: '#e74c3c' },
    's': { lane: 1, name: 'Rechts Stamp', color: '#3498db' },
    'd': { lane: 2, name: 'Armen Hoog', color: '#2ecc71' },
    'f': { lane: 3, name: 'Hoofd Bang', color: '#f39c12' }
};

/**
 * Starts or stops the hakken game
 */
function toggleHakken() {
    if (hakken.state === 'playing') {
        stopHakken();
    } else {
        startHakken();
    }
}

/**
 * Starts the hakken game
 */
function startHakken() {
    hakken.state = 'playing';
    hakken.score = 0;
    hakken.combo = 0;
    hakken.maxCombo = 0;
    hakken.notes = [];
    hakken.spawnTimer = 0;
    hakken.timeRemaining = hakken.gameDuration;

    // Update UI - use the actual HTML element IDs
    const startBtn = document.getElementById('hakkenStartBtn');
    const scoreDisplay = document.getElementById('hakkenScore');
    const comboDisplay = document.getElementById('comboDisplay');
    const comboCount = document.getElementById('comboCount');
    const timerDisplay = document.getElementById('hakkenTimer');
    const resultDisplay = document.getElementById('hakkenResult');

    if (startBtn) startBtn.textContent = '⏹️ Stop';
    if (scoreDisplay) scoreDisplay.textContent = '0';
    if (comboDisplay) comboDisplay.style.display = 'none';
    if (comboCount) comboCount.textContent = '0';
    if (timerDisplay) timerDisplay.textContent = hakken.timeRemaining + 's';
    if (resultDisplay) resultDisplay.style.display = 'none';

    // Clear any existing notes on screen
    const noteLanes = document.querySelectorAll('.hakken-note');
    noteLanes.forEach(function(note) {
        note.remove();
    });

    // Start the game loop
    hakkenGameLoop();

    // Start the timer
    hakken.timerInterval = setInterval(function() {
        hakken.timeRemaining--;
        if (timerDisplay) timerDisplay.textContent = hakken.timeRemaining + 's';

        if (hakken.timeRemaining <= 0) {
            finishHakken();
        }
    }, 1000);
}

/**
 * Main game loop for hakken
 */
function hakkenGameLoop() {
    if (hakken.state !== 'playing') return;

    // Spawn new notes periodically
    hakken.spawnTimer++;
    const spawnRate = Math.floor(60 / (hakken.bpm / 60));  // Notes per beat

    if (hakken.spawnTimer >= spawnRate) {
        hakken.spawnTimer = 0;
        spawnHakkenNote();
    }

    // Move existing notes
    moveHakkenNotes();

    // Continue loop
    hakken.gameLoop = requestAnimationFrame(hakkenGameLoop);
}

/**
 * Spawns a new note to hit
 */
function spawnHakkenNote() {
    // Random lane (a, s, d, f)
    const keys = Object.keys(hakkenMoves);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    const move = hakkenMoves[randomKey];

    // Create note element
    const noteEl = document.createElement('div');
    noteEl.className = 'hakken-note';
    noteEl.setAttribute('data-key', randomKey);
    noteEl.style.cssText = `
        position: absolute;
        width: 50px;
        height: 50px;
        background: ${move.color};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 1.5em;
        color: white;
        text-transform: uppercase;
        top: 0;
        left: ${move.lane * 60 + 10}px;
        box-shadow: 0 0 15px ${move.color};
        transition: transform 0.1s;
    `;
    noteEl.textContent = randomKey.toUpperCase();

    // Add to note track
    const noteTrack = document.getElementById('hakkenNoteTrack');
    if (noteTrack) {
        noteTrack.appendChild(noteEl);

        // Store note data
        hakken.notes.push({
            element: noteEl,
            key: randomKey,
            y: 0,
            hit: false
        });
    }
}

/**
 * Moves all notes down the screen
 */
function moveHakkenNotes() {
    const hitZoneY = 250;  // Y position of hit zone
    const missZoneY = 300; // Y position where notes are missed

    hakken.notes.forEach(function(note, index) {
        if (note.hit) return;

        // Move note down
        note.y += hakken.noteSpeed;
        note.element.style.top = note.y + 'px';

        // Check if missed (passed hit zone)
        if (note.y > missZoneY) {
            // Missed note
            note.element.style.opacity = '0.3';
            hakken.combo = 0;
            updateHakkenCombo();

            // Remove after animation
            setTimeout(function() {
                if (note.element.parentNode) {
                    note.element.remove();
                }
            }, 200);

            // Mark as hit (processed)
            note.hit = true;
        }
    });

    // Clean up processed notes
    hakken.notes = hakken.notes.filter(function(note) {
        return !note.hit || note.y < missZoneY + 50;
    });
}

/**
 * Handles a key hit for hakken game
 *
 * @param {string} key - The key that was pressed (a, s, d, f)
 */
function hakkenHit(key) {
    if (hakken.state !== 'playing') return;

    const move = hakkenMoves[key.toLowerCase()];
    if (!move) return;

    const hitZoneY = 250;
    const hitTolerance = 70;  // How close to hit zone counts as a hit (larger = easier!)

    // Find notes in this lane that are near the hit zone
    let hitNote = null;
    let hitDistance = Infinity;

    hakken.notes.forEach(function(note) {
        if (note.hit || note.key !== key.toLowerCase()) return;

        const distance = Math.abs(note.y - hitZoneY);
        if (distance < hitTolerance && distance < hitDistance) {
            hitNote = note;
            hitDistance = distance;
        }
    });

    if (hitNote) {
        // Successful hit!
        hitNote.hit = true;

        // Score based on accuracy
        let points = 100;
        let hitText = 'GOED!';

        if (hitDistance < 10) {
            points = 300;
            hitText = 'PERFECT!';
        } else if (hitDistance < 20) {
            points = 200;
            hitText = 'GEWELDIG!';
        }

        // Add combo bonus
        points += hakken.combo * 10;
        hakken.score += points;
        hakken.combo++;

        if (hakken.combo > hakken.maxCombo) {
            hakken.maxCombo = hakken.combo;
        }

        // Update displays
        const scoreDisplay = document.getElementById('hakkenScore');
        if (scoreDisplay) scoreDisplay.textContent = hakken.score;
        updateHakkenCombo();

        // Visual feedback on note
        hitNote.element.style.transform = 'scale(1.5)';
        hitNote.element.style.opacity = '0';
        hitNote.element.textContent = hitText;

        // Animate Pascal
        animatePascal(key);

        // Remove note
        setTimeout(function() {
            if (hitNote.element.parentNode) {
                hitNote.element.remove();
            }
        }, 200);
    } else {
        // Missed - pressed wrong key or no note to hit
        hakken.combo = 0;
        updateHakkenCombo();
    }
}

/**
 * Updates the combo display
 */
function updateHakkenCombo() {
    const comboDisplay = document.getElementById('comboDisplay');
    const comboCount = document.getElementById('comboCount');

    if (comboDisplay && comboCount) {
        comboCount.textContent = hakken.combo;

        // Show/hide combo display based on combo count
        if (hakken.combo >= 2) {
            comboDisplay.style.display = 'block';

            // Add visual flair for high combos
            if (hakken.combo >= 10) {
                comboDisplay.style.background = 'rgba(244,208,63,0.9)';
            } else if (hakken.combo >= 5) {
                comboDisplay.style.background = 'rgba(230,126,34,0.9)';
            } else {
                comboDisplay.style.background = 'rgba(231,76,60,0.8)';
            }
        } else {
            comboDisplay.style.display = 'none';
        }
    }
}

/**
 * Animates Pascal doing the dance move
 *
 * @param {string} key - Which move to do
 */
function animatePascal(key) {
    const pascal = document.getElementById('pascal');
    if (!pascal || hakken.isAnimating) return;

    hakken.isAnimating = true;

    // Different animation based on key
    switch(key.toLowerCase()) {
        case 'a':
            // Left stomp
            pascal.style.transform = 'translateX(-20px) rotate(-10deg)';
            break;
        case 's':
            // Right stomp
            pascal.style.transform = 'translateX(20px) rotate(10deg)';
            break;
        case 'd':
            // Arms up
            pascal.style.transform = 'translateY(-30px) scale(1.1)';
            break;
        case 'f':
            // Head bang
            pascal.style.transform = 'rotate(15deg) translateY(10px)';
            break;
    }

    // Reset after animation
    setTimeout(function() {
        pascal.style.transform = 'translateX(0) rotate(0)';
        hakken.isAnimating = false;
    }, 100);
}

/**
 * Stops the hakken game early
 */
function stopHakken() {
    hakken.state = 'ready';

    if (hakken.gameLoop) {
        cancelAnimationFrame(hakken.gameLoop);
    }
    if (hakken.timerInterval) {
        clearInterval(hakken.timerInterval);
    }

    const startBtn = document.getElementById('hakkenStartBtn');
    if (startBtn) startBtn.textContent = '🎵 Start Hakken!';
}

/**
 * Finishes the hakken game and shows results
 */
function finishHakken() {
    hakken.state = 'finished';

    if (hakken.gameLoop) {
        cancelAnimationFrame(hakken.gameLoop);
    }
    if (hakken.timerInterval) {
        clearInterval(hakken.timerInterval);
    }

    // Calculate rating
    let rating, message;
    if (hakken.score >= 5000) {
        rating = '🏆 GABBER KONING!';
        message = 'Pascal is trots! Je bent een echte hakker!';
    } else if (hakken.score >= 3000) {
        rating = '🎉 Geweldig!';
        message = 'Je hebt de moves! Nog even oefenen voor Thunderdome.';
    } else if (hakken.score >= 1500) {
        rating = '👍 Niet slecht!';
        message = 'Je begint het te snappen. Blijf hakken!';
    } else {
        rating = '😅 Beginner';
        message = 'Iedereen begint ergens. Probeer nog een keer!';
    }

    // Show results
    const resultDisplay = document.getElementById('hakkenResult');
    const startBtn = document.getElementById('hakkenStartBtn');

    if (resultDisplay) {
        resultDisplay.style.display = 'block';
        resultDisplay.innerHTML = `
            <div style="font-size: 1.5em; color: #f4d03f; margin-bottom: 10px;">${rating}</div>
            <div style="font-size: 2em; margin-bottom: 10px;">${hakken.score} punten</div>
            <div style="color: #888;">Max Combo: ${hakken.maxCombo}</div>
            <div style="margin-top: 10px; color: #aaa;">${message}</div>
        `;
    }

    if (startBtn) startBtn.textContent = '🎵 Opnieuw!';
}

/**
 * Handles keyboard input for hakken game
 */
function handleHakkenKeyDown(e) {
    if (hakken.state !== 'playing') return;

    const key = e.key.toLowerCase();
    if (['a', 's', 'd', 'f'].includes(key)) {
        hakkenHit(key);
        e.preventDefault();
    }
}


/* =============================================================================
   UPDATED INITIALIZATION
   =============================================================================

   Add keyboard listeners for the new games
*/

// Add keyboard event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // ... existing initialization code runs first ...

    // Add keyboard listeners for parachute game
    document.addEventListener('keydown', handleParachuteKeyDown);
    document.addEventListener('keyup', handleParachuteKeyUp);

    // Add keyboard listeners for hakken game
    document.addEventListener('keydown', handleHakkenKeyDown);

    // Set up mobile touch controls for both games
    setupParachuteMobileControls();
    setupHakkenMobileControls();
});

/**
 * Sets up mobile touch controls for hakken game
 * Makes the buttons work better on touch devices
 */
function setupHakkenMobileControls() {
    const buttons = document.querySelectorAll('.hakken-btn');

    buttons.forEach(function(btn) {
        const key = btn.getAttribute('data-key');
        if (!key) return;

        // Add touch feedback
        btn.addEventListener('touchstart', function(e) {
            if (hakken.state === 'playing') {
                hakkenHit(key);
                btn.style.transform = 'scale(0.9)';
                btn.style.filter = 'brightness(1.5)';
            }
            e.preventDefault();
        }, { passive: false });

        btn.addEventListener('touchend', function() {
            btn.style.transform = 'scale(1)';
            btn.style.filter = 'brightness(1)';
        });
    });
}


/* =============================================================================
   GLOBAL FUNCTIONS (for onclick attributes in HTML)
   =============================================================================

   These functions are attached to window so they can be called from HTML
   onclick attributes. For example: onclick="resetGame()"
*/

// Make functions globally available
window.setTarget = setTarget;
window.handleClick = handleSteakClick;
window.resetGame = resetSteakGame;
window.toggleMusic = toggleMusic;

// New game functions
window.switchGame = switchGame;
window.resetParachuteGame = resetParachuteGame;
window.hakkenHit = hakkenHit;
window.toggleHakken = toggleHakken;
