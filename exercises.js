// The workout, in order. Each exercise: id, name, anim (3D animation in figure3d.js),
// reps (big + unit), sets, rest seconds, noTimer (no rest timer), muscle key labels
// (mpl primary, msl secondary), tips (how to do it) and mistakes ([mistake, fix]).
const STEPS = [
  {
    id:'circ', name:'Arm circles', anim:'circ',
    big:'10 + 10', unit:'forwards, then backwards', sets:1, rest:0, noTimer:true,
    mpl:'Shoulders', msl:'Upper back',
    tips:[
      'Stand tall with your arms straight out to the sides.',
      'Make small circles first, then gradually bigger ones.',
      '10 forwards, then 10 backwards.',
    ],
    mistakes:[
      ['Shrugging your shoulders up', 'Keep your shoulders down and relaxed, neck long.'],
      ['Going big straight away', 'Start with small circles and widen them gradually. Stop short of any pinch.'],
      ['Letting your arms droop or bend', 'Keep your arms straight and level with your shoulders.'],
    ],
  },
  {
    id:'pull', name:'Band pull-aparts', anim:'pull',
    big:'15', unit:'reps', sets:1, rest:0, noTimer:true,
    mpl:'Upper back', msl:'Rear shoulders',
    tips:[
      'Hold the band at chest height with straight arms, hands shoulder-width apart.',
      'Pull it apart until it touches your chest, squeezing your shoulder blades together.',
      'Return slowly. Keep your shoulders down, away from your ears.',
    ],
    mistakes:[
      ['Shrugging towards your ears', 'Keep your shoulders down and squeeze your shoulder blades together and down.'],
      ['Bending your elbows', 'Keep your arms straight. Bent elbows turn it into a row and take the work off your upper back.'],
      ['Arching your lower back to finish the rep', "Brace your abs and keep your ribs down. If you can't, grip the band wider or use a lighter one."],
      ['Letting the band snap back', 'Control the return. Take about 2 seconds to bring your hands back together.'],
    ],
  },
  {
    id:'scap', name:'Scapular pulls', anim:'scap',
    big:'6–8', unit:'reps', sets:3, rest:60,
    mpl:'Lower traps', msl:'Lats',
    tips:[
      'Hang with straight arms.',
      'Pull your shoulder blades down and back, like putting them in your back pockets.',
      'Elbows stay locked. The movement is small.',
      'This teaches your back, not your arms, to start every pull.',
    ],
    mistakes:[
      ['Bending your elbows', 'Your arms stay straight the whole time. Only your shoulder blades move.'],
      ['Shrugging up instead of pulling down', 'Think "shoulders away from ears". Your chest lifts slightly as you pull down.'],
      ['Swinging or kicking', 'Keep your legs still and pause for a second at the top of each rep.'],
    ],
  },
  {
    id:'neg', name:'Pull-up negatives', anim:'neg',
    big:'3', unit:'reps · 3–5 sec down', sets:3, rest:90,
    mpl:'Lats and upper back', msl:'Biceps, forearms, rear shoulders',
    tips:[
      "Start with your chin already over the bar. Step off the chair, don't jump up.",
      'Lower as slowly as you can, 3–5 seconds, all the way to straight arms.',
      "Fight the bottom half. That's where people drop.",
      'Step back up on the chair for each rep.',
      'Only use the 2 small bands if you drop in under 2 seconds.',
    ],
    mistakes:[
      ['Dropping through the bottom half', 'Count the seconds out loud and fight all the way down. If you drop in under 2 seconds, add the bands.'],
      ['Stopping before your arms are straight', 'Lower all the way to a full hang. The bottom is where you build the strength to start a pull-up.'],
      ['Jumping up to the top', 'Step up from the chair so you start each rep controlled, chin already over the bar.'],
      ['Kicking or swinging your legs', 'Keep your legs together and slightly in front of you, with your abs tight.'],
    ],
  },
  {
    id:'chin', name:'Banded chin-ups', anim:'chin',
    big:'Max', unit:'clean reps', sets:3, rest:120,
    mpl:'Lats and biceps', msl:'Forearms, traps',
    tips:[
      'Palms facing you.',
      'Pull your shoulders down first, then pull up.',
      'Clean reps only. Stop when your form breaks.',
      'At 5+ reps for all sets, switch to 1 small band.',
    ],
    mistakes:[
      ['Pulling with just your arms', 'Start each rep by pulling your shoulders down, then drive your elbows towards your ribs.'],
      ['Half reps', 'Go from straight arms at the bottom to chin over the bar at the top. Fewer full reps beat more half ones.'],
      ['Swinging or kicking', 'Squeeze your glutes and keep your legs together so your body stays still.'],
      ['Letting the band throw you down', 'Lower yourself under control instead of dropping.'],
    ],
  },
  {
    id:'row', name:'One-arm rows', anim:'row',
    big:'8–10', unit:'reps each side', sets:3, rest:60,
    mpl:'Lats and mid-back', msl:'Biceps, rear shoulder',
    tips:[
      'One hand on a chair, back flat and close to parallel with the floor.',
      'Pull the dumbbell toward your hip, not your chest.',
      'Lower it slowly with control.',
      'Both sides count as 1 set.',
      'When 3 × 15 feels easy, go up a weight and start back at 8 reps.',
    ],
    mistakes:[
      ['Rounding your lower back', "Hinge at your hips with a flat back, chest up, eyes on the floor just ahead. If you can't hold it flat, rest your knee on the chair too, on the same side as the hand that's on the chair. That takes most of the load off your lower back."],
      ['Twisting your torso to lift the weight', 'Keep your hips and shoulders square to the floor. If you have to twist to get it up, the weight is too heavy.'],
      ['Standing too upright or too far from the chair', "Put your hand right under your shoulder, feet wide and knees soft, so your back isn't holding you up."],
      ['Yanking the weight up', 'Pull smoothly, pause at the top, and take 2 seconds to lower it.'],
      ['Pulling towards your chest', 'Pull towards your hip with your elbow close to your side.'],
    ],
  },
  {
    id:'push', name:'Incline push-ups', anim:'push',
    big:'8–10', unit:'reps', sets:3, rest:60,
    mpl:'Chest', msl:'Triceps, front shoulders, core',
    tips:[
      'Use a counter or table high enough for 8–10 good reps.',
      'Keep your body in one straight line, head to heels.',
      'Lower your chest to the edge, then push away.',
      'At 3 × 12, move to a lower surface.',
    ],
    mistakes:[
      ['Hips sagging', 'Squeeze your glutes and brace your abs to keep one straight line from head to heels.'],
      ['Hips piking up', 'Lower your hips into the same straight line. Your chest, not your hips, should reach the edge first.'],
      ['Elbows flaring straight out', 'Tuck your elbows to about 45° from your body, hands just outside your shoulders.'],
      ['Half reps or dropping your head', 'Bring your chest to the edge with your neck in line with your body.'],
    ],
  },
  {
    id:'press', name:'Floor press', anim:'press',
    big:'10', unit:'reps', sets:3, rest:60,
    mpl:'Chest', msl:'Triceps, front shoulders',
    tips:[
      'Lie on your back with knees bent.',
      'Lower until your elbows touch the floor.',
      'Press straight up over your chest.',
      'When 10 reps feels easy, go up a weight.',
    ],
    mistakes:[
      ['Elbows flaring out wide', "Keep your elbows about 45° from your body. It's easier on your shoulders."],
      ['Bouncing your elbows off the floor', 'Touch down softly and pause for a moment before you press.'],
      ['Wrists bent back', 'Stack your wrists over your elbows, knuckles pointing to the ceiling.'],
      ['Weights drifting towards your face', 'Press up over your chest, not over your head.'],
    ],
  },
  {
    id:'hang', name:'Dead hang', anim:'hang',
    big:'Max', unit:'hold · aim 30 s+', sets:2, rest:60,
    mpl:'Grip and forearms', msl:'Lats, traps',
    tips:[
      'Hang with straight arms and a firm grip.',
      'Keep your shoulders slightly pulled down, not up by your ears.',
      'Breathe steadily.',
      'Aim to build up to 30 seconds or more.',
    ],
    mistakes:[
      ['Shoulders up by your ears', "Pull your shoulders slightly down so you're hanging actively, not sinking into the joint."],
      ['Swinging', 'Get on the bar from the chair and keep your legs together and still.'],
      ['Holding your breath', 'Breathe slowly and steadily the whole time.'],
      ['Thumb off the bar', 'Wrap your thumb around the bar for a stronger, safer grip.'],
    ],
  },
];
