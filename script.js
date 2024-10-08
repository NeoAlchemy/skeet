let targetedClayPigeon = null; // Variable to track the intersected clay pigeon
let points = 0; // Variable to track points earned
let level = 1; // variable to track level
let shotsFired = 0;
let clayPigeonsDestroyed = 0;
let clayPigeonPerLevel = 1;
let lastShotTime = 0;  // Keeps track of the last time the function was executed
const SHOT_COOLDOWN = 1000; // 1 second in milliseconds
const MAX_SHOT_SHELL = 8;

AFRAME.registerComponent('radar-indicator', {
    schema: {
      target: { type: 'selector' }  // The clay pigeon entity
    },
    init: function () {
      this.cameraEl = document.querySelector('#camera');  // Reference to the camera
      this.radarBlip = document.querySelector('#blip');   // Reference to the blip on the radar
      this.target = document.querySelector('#clayPigeon1'); //this.data.target;  // The clay pigeon
    },
    tick: function () {
      var cameraPos = new THREE.Vector3();
      var targetPos = new THREE.Vector3();

      // Get world positions of the camera and clay pigeon
      this.cameraEl.object3D.getWorldPosition(cameraPos);
      this.target.object3D.getWorldPosition(targetPos);

      // Calculate 2D position on radar (ignoring vertical difference)
      var direction = new THREE.Vector3();
      direction.subVectors(targetPos, cameraPos);

      var angle = Math.atan2(direction.x, direction.z);  // Get angle in the XZ plane
      var distance = Math.min(direction.length(), 5);  // Limit radar distance to a radius of 5

      // Convert the angle and distance to 2D radar coordinates
      var scale = 0.5;
      var radarX = Math.sin(angle) * distance * scale * 0.03;  // Scale distance appropriately
      var radarY = Math.cos(angle) * distance * scale * 0.03;

      // Update the blip's position on the radar
      this.radarBlip.object3D.position.set(radarX, -1, -2);
      this.radarBlip.setAttribute('visible', true);  // Make blip visible
    }
  });

AFRAME.registerComponent('shotgun-raycaster', {
    init: function () {
        const raycasterEl = this.el;
        
        // Event listener to detect intersection with objects
        raycasterEl.addEventListener('raycaster-intersection', function(event) {
            console.time()
            console.log("rayCaster-intersection entered")
            const intersects = event.detail.intersections;
            if (intersects.length > 0 && intersects[0].object.el.classList.contains('collidable')) {
                targetedClayPigeon = intersects[0].object.el;
                console.log("Shotgun aimed at", targetedClayPigeon.id);
            } else {
                console.log("no target in line of sight")
                targetedClayPigeon = null; // No target in line of sight
            }
        });

        raycasterEl.addEventListener('raycaster-intersection-cleared', function(event) {
            console.timeEnd()
            console.log("rayCaster-intersection exited")
            targetedClayPigeon = null; // No target in line of sight
        });
    },

    tick: function() {
        this.el.components.raycaster.refreshObjects();  // Force raycaster to update
    }
});

AFRAME.registerComponent('update-raycaster-target', {
    init: function () {
        this.el.addEventListener('animationcomplete', () => {
            this.el.components.raycaster.refreshObjects();  // Refresh after animations
            console.log('Pigeon Position:', pigeon.getAttribute('position'));
        });
    }
});


// Function to handle the shoot button click
function shootClayPigeon() {
    const currentTime = Date.now(); // Get current timestamp

    // Only allow execution if 1 second has passed since the last execution
    if (currentTime - lastShotTime < SHOT_COOLDOWN) {
        return; // Prevent execution
    }

    // Update the timestamp for the last shot
    lastShotTime = currentTime;


    if (shotsFired < MAX_SHOT_SHELL) {
        document.getElementById('skeetFireEntity').components.sound.playSound();
        shotsFired++
        document.getElementById("shotgunShell"+shotsFired).style.opacity = 0.3
        if (targetedClayPigeon) {
            // Hide the clay pigeon if it was hit
            targetedClayPigeon.setAttribute('visible', 'false');
            targetedClayPigeon.removeAttribute('animation')
            targetedClayPigeon.setAttribute('position', '-100, -100,')
            targetedClayPigeon.removeAttribute('class')

            // Points
            let targetedClayPigeonPoints = targetedClayPigeon.getAttribute('data-points');
            console.log("points earned: " + targetedClayPigeonPoints +"!");
            points += Number(targetedClayPigeonPoints);

            // count clay pigeons
            clayPigeonsDestroyed++
            setTimeout(() => {
                document.getElementById('clayPigeonBreakEntity').components.sound.playSound();
                if (clayPigeonsDestroyed >= clayPigeonPerLevel) {
                    nextLevel(); // go to next level
                }
            }, 200);
            document.getElementById("points").innerHTML = points;
            console.log("Pigeon shot:", targetedClayPigeon.id);
            targetedClayPigeon = null; // Reset after shooting
            
        } else {
            console.log("No pigeon in sight");
            if (shotsFired >= MAX_SHOT_SHELL && clayPigeonsDestroyed < clayPigeonPerLevel) {
                gameOver()
            }
        }
    } else {
        if (clayPigeonsDestroyed < clayPigeonPerLevel) {
            gameOver()
        }
    }
}

function gameOver() {
    document.getElementById("game-over-screen").style.display = "flex"
    hideVRStuff()
}

function hideVRStuff() {
    document.getElementById("vrScene").style.display = "none"
    document.getElementById('shoot').style.display = 'none';
    document.getElementById('vrScene').style.display = 'none';
    document.getElementById('points').style.display = 'none';
    document.getElementById('level').style.display = 'none';
    document.querySelectorAll('.shotgunShell').forEach((shell) => {
        shell.style.display = 'none';
    })
}

function showVRStuff() {
    
    
    
    const vrScene = document.getElementById('vrScene');
    // Once the scene has loaded, hide the loading screen and show the VR scene
    if (!vrScene.hasLoaded) {
        document.getElementById('loadingScreen').style.display = 'flex';
        vrScene.addEventListener('loaded', function() {
            vrScene.style.display = 'block';
            document.getElementById('loadingScreen').style.display = 'none';
            document.getElementById('shoot').style.display = 'block';
            document.getElementById('points').style.display = 'block'; 
            document.getElementById('levels').style.display = 'block'; 
            newVRStuff()   
        });

        vrScene.addEventListener('scene-error', function (error) {
            console.error('An error occurred while loading the scene:', error);
            document.getElementById('errorScreen').style.display = 'flex';
        });
    } else {
        document.getElementById("vrScene").style.display = "block"
        document.getElementById('shoot').style.display = 'block';
        document.getElementById('points').style.display = 'block';
        document.getElementById('levels').style.display = 'block';
        newVRStuff()
    }
    
}

function nextLevel() {
    resetVRStuff();
    levels++
    setLevel(levels);
    document.getElementById("levels").innerHTML = "Level: " + levels;
}

function newVRStuff() {
    resetVRStuff();
    points = 0;
    levels = 1;
    setLevel(1);
    document.getElementById("levels").innerHTML = "Level: " + levels;
}

function resetVRStuff() {
    document.querySelectorAll('.shotgunShell').forEach((shell) => {
        shell.style.display = 'block';
        shell.style.opacity = '1';
    })

    document.querySelectorAll('.collidable').forEach(pigeon => {
        pigeon.addEventListener('animationtick', function () {
            document.querySelector('#raycasterEl').components.raycaster.refreshObjects();
        });
    });

    // Force loading of A-Frame assets
    vrScene.setAttribute('visible', 'true');

    // reset global vars for VR
    targetedClayPigeon = null; 
    shotsFired = 0;
    clayPigeonsDestroyed = 0;
}

function getQueryParam(paramName) {
    // Get the full URL of the current page
    const url = window.location.href;

    // Create a URL object
    const urlParams = new URLSearchParams(window.location.search);

    // Check if a specific query parameter exists
    if (urlParams.has(paramName)) {
        // Get the value of the query parameter
        const paramValue = urlParams.get(paramName);
        
        // Do something with the value
        console.log('Value of paramName:', paramValue);
        
        return paramValue;
    } else {
        return 0;
    }
}

function setLevel(level) {
    value = getQueryParam('level') ? getQueryParam('level') : level;
    levels = value;
    fetch('assets/json/level'+value+'.json')
    .then(response => response.json())
    .then(data => {
        // For each pigeon in the JSON data
        clayPigeonPerLevel = data.pigeons.length;
        data.pigeons.forEach(pigeonData => {
            const pigeon = document.getElementById(pigeonData.id);

            pigeon.setAttribute('visible', pigeonData.visible.toString());
            pigeon.setAttribute('class', pigeonData.class);
            pigeon.setAttribute('data-points', pigeonData['data-points']);
            pigeon.setAttribute('position', pigeonData.position);          
            pigeon.setAttribute('scale', pigeonData.scale);

            // Apply animations
            if (pigeonData.animations) {
            Object.keys(pigeonData.animations).forEach(animationKey => {
                const animation = pigeonData.animations[animationKey];
                pigeon.setAttribute(animationKey, `property: ${animation.property}; from: ${animation.from || ''}; to: ${animation.to}; dur: ${animation.dur}; easing: ${animation.easing}; loop: ${animation.loop}`);
            });
            }
        });
    })
}

function startVR() {
    document.querySelector('.launch-screen').style.display = 'none';
    document.getElementById("game-over-screen").style.display == 'none';

    showVRStuff();
};

/**
 * Double Click Hide
 */
document.addEventListener('gesturestart', function (e) {
    e.preventDefault(); // Disable gestures (like zoom)
});

document.addEventListener('dblclick', function (e) {
    e.preventDefault(); // Prevent double-click zoom
});
