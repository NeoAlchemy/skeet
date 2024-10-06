let targetedClayPigeon = null; // Variable to track the intersected clay pigeon
let points = 0; // Variable to track points earned
let shotsFired = 0;
let clayPigeonsDestroyed = 0;
let lastShotTime = 0;  // Keeps track of the last time the function was executed
const shotCooldown = 1000; // 1 second in milliseconds

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
    if (currentTime - lastShotTime < shotCooldown) {
        return; // Prevent execution
    }

    // Update the timestamp for the last shot
    lastShotTime = currentTime;


    if (shotsFired < 8) {
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
                if (clayPigeonsDestroyed >= 3) {
                    resetVRStuff(); // go to next level
                }
            }, 200);
            document.getElementById("points").innerHTML = points;
            console.log("Pigeon shot:", targetedClayPigeon.id);
            targetedClayPigeon = null; // Reset after shooting
            
        } else {
            console.log("No pigeon in sight");
            if (shotsFired >= 8 && clayPigeonsDestroyed < 3) {
                gameOver()
            }
        }
    } else {
        if (clayPigeonsDestroyed < 3) {
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
            resetVRStuff()   
        });

        vrScene.addEventListener('scene-error', function (error) {
            console.error('An error occurred while loading the scene:', error);
            document.getElementById('errorScreen').style.display = 'flex';
        });
    } else {
        document.getElementById("vrScene").style.display = "block"
        document.getElementById('shoot').style.display = 'block';
        document.getElementById('points').style.display = 'block';
        resetVRStuff()
    }

    
    
    
}

function resetVRStuff() {
    document.querySelectorAll('.shotgunShell').forEach((shell) => {
        shell.style.display = 'block';
        shell.style.opacity = '1';
    })

    const pigeons = ['clayPigeon1', 'clayPigeon2', 'clayPigeon3'];   
         
    pigeons.forEach(id => {
        const pigeon = document.getElementById(id);
        // Reset visibility
        pigeon.setAttribute('visible', 'true');
        
        // Reset the positions and animations
        if (id === 'clayPigeon1') {
            pigeon.setAttribute('position', '-10 0 -20');
            pigeon.setAttribute('class', 'collidable');
            pigeon.setAttribute('data-points', '50')
            pigeon.setAttribute('animation__fall', 'property: position; from: 0 20 -25; dur: 3000; easing: easeInOutQuad; to: 10 0 -30; loop: true');
            pigeon.setAttribute('animation__smaller', 'property: scale; dur: 3000; to: 0.1 0.1 0.1; loop: true');
        } else if (id === 'clayPigeon2') {
            pigeon.setAttribute('data-points', '50')
            pigeon.setAttribute('class', 'collidable');
            pigeon.setAttribute('position', '-5 2 -15');
            pigeon.setAttribute('animation', 'property: position; to: 15 6 -35; dur: 6000; easing: easeInOutQuad; loop: true');
            pigeon.setAttribute('animation__smaller', 'property: scale; dur: 6000; to: 0.1 0.1 0.1; loop: true');
        } else if (id === 'clayPigeon3') {
            pigeon.setAttribute('data-points', '10')
            pigeon.setAttribute('class', 'collidable');
            pigeon.setAttribute('position', '-15 3 -10');
            pigeon.setAttribute('animation', 'property: position; to: 5 8 -20; dur: 5000; easing: easeOutQuad; loop: true');
        }
    });

    document.querySelectorAll('.collidable').forEach(pigeon => {
        pigeon.addEventListener('animationtick', function () {
            document.querySelector('#raycasterEl').components.raycaster.refreshObjects();
        });
    });

    // Force loading of A-Frame assets
    vrScene.setAttribute('visible', 'true');

    // reset global vars for VR
    targetedClayPigeon = null; 
    points = 0;
    shotsFired = 0;
    clayPigeonsDestroyed = 0;
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
