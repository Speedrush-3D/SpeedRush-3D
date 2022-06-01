var soundAudio;

function setupAudio() {

    // background music
    const musicAudio = new Howl({
      src: ['./assets/music.mp3'],
      autoplay: true,
      loop: true,
    });
    
    const musicId = musicAudio.play();
    musicAudio.fade(0, 1, 2000, musicId);
    
    // sound effects
    // (8 sounds for bonus collection + 1 "crash" sound, each 1 second)
    const sounds = {};
    sounds.left = [0,500];
    sounds.right = [2000,500];
    sounds.bump = [3000,1000];
    sounds.bonus = [4000,1000];
    sounds.crash = [5000, 8000];

    soundAudio = new Howl({
        src: ['./assets/sounds.mp3'],
        volume: 0.5,
        sprite: sounds,
    });
}