
// CONSTANTS
var TODAY = new Date();
var DD = String(TODAY.getDate()).padStart(2, '0');
var MM = String(TODAY.getMonth() + 1).padStart(2, '0');
var YYYY = TODAY.getFullYear();
const DATE = YYYY + MM + DD;

// EXPERIMENTAL PARAMETERS
const PRACT_REP = 1;
const EXP_REP = 3;
const FIX_DUR = 500;
const FDBCK_DUR = 1000;
const ITI_DURATION = [500, 750, 1000];

// Welcome
var welcome_block = {
    data: {
        screen_id: "welcome"
    },
    type: "survey-html-form",
    preamble: "<p>Welcome to the experiment!</p>" +
        "Please complete the form",
    html: "<p>Participant ID: <input name='Part_ID' type='text' /></p>",
    on_finish: function(data) {
        responses = JSON.parse(data.responses);
        jsPsych.data.addProperties({
            part_ID: responses.Part_ID,
            ID_DATE: responses.Part_ID + "_" + DATE,
        })
    }
};

// Instructions
var instruction_block = {
    data: {
        screen_id: "instructions"
    },
    type: "instructions",
    pages: [
        "<p>In this experiment, a circle will appear in hte middle of the screen. </p>" +
        "<p>If the color of the circle is <b>blue</b>, press the <b>left</b> key.</p> " +
        "<p>If the color of the circle is <b>orange</b>, press the <b>right</b> key.</p>" +
        "<div style='float: left;'><img src='img/blue.png'/>" +
        "<p><b>Press the left key</b></p></div>" +
        "<div style='float: right;'><img src='img/orange.png'/>" +
        "<p><b>Press the right key</b></p></div>",
        "We will begin with some practice trials."
    ],
    show_clickable_nav: true,
};

// set factorial design
var factors = {
    stimulus: ["img/blue.png", "img/orange.png"], // factor 1
    trial_duration: [300, 1000], // factor 2
};
var full_design = jsPsych.randomization.factorial(factors, 1);
var i;
for (i = 0; i < full_design.length; i++) {
    if (full_design[i].stimulus == "img/blue.png") { // if blue
        full_design[i].data = {screen_id: "trial", stimulus: "blue", correct_response: 37}
    } else {
        full_design[i].data = {screen_id: "trial", stimulus: "orange", correct_response: 39}
    }
}

// Fixation point
var fixation_point = {
    data: {screen_id: "fixation", stimulus: "+"},
    type: "html-keyboard-response",
    stimulus: "<div style='font-size: 60px'><b>+</b></div>",
    choices: jsPsych.NO_KEYS,
    trial_duration: FIX_DUR,
};

// Create trials
var trial = {
    data: jsPsych.timelineVariable("data"),
    type: "image-keyboard-response",
    stimulus: jsPsych.timelineVariable("stimulus"),
    choices: [37, 39],
    trial_duration: jsPsych.timelineVariable("trial_duration"),
    on_finish: function(data) {
        if (data.key_press == data.correct_response) { // key press == correct response
            data.accuracy = 1
        } else { // key press != correct response
            data.accuracy = 0
        }
    }
};

// feedback
var feedback_trial = {
    on_start: function(trial) {
        var last_trial_accuracy = jsPsych.data.get().last(1).values()[0].accuracy;
        if (last_trial_accuracy == 1) {
            var fdbck = "correct"; // give a variable for feedback
        } else {
            var fdbck = "incorrect";// give a variable for feedback
        }

        var fdbck_trial_stim = "<div style='font-size: 60px;'><b>" + fdbck + "</b></div>";

        trial.data = {screen_id: "feedback", stimulus: fdbck};
        trial.stimulus = fdbck_trial_stim;
    },
    data: "",
    type: "html-keyboard-response",
    stimulus: "",
    choices: jsPsych.NO_KEYS,
    trial_duration: FDBCK_DUR,
    post_trial_gap: jsPsych.randomization.sampleWithoutReplacement(ITI_DURATION, 2),
};

var pract_procedure = {
    timeline: [fixation_point, trial, feedback_trial],
    timeline_variables: full_design,
    randomize_order: true,
    repetitions: PRACT_REP,
};

// Experiment instructions
var exp_instructions = {
    data: {
        screen_id: "exp_instructions"
    },
    type: "instructions",
    pages: [
        "<p>We have completed our practice. Remember, </p>" +
        "<p>If the color of the circle is <b>blue</b>, press the <b>left</b> key.</p> " +
        "<p>If the color of the circle is <b>orange</b>, press the <b>right</b> key.</p>" +
        "<div style='float: left;'><img src='img/blue.png'/>" +
        "<p><b>Press the left key</b></p></div>" +
        "<div style='float: right;'><img src='img/orange.png'/>" +
        "<p><b>Press the right key</b></p></div>",
        "We will begin the experiment now."
    ],
    show_clickable_nav: true,
};

// Experimental trials
var exp_procedure = {
    timeline: [fixation_point, trial],
    timeline_variables: full_design,
    randomize_order: true,
    repetitions: EXP_REP,
};

// Debrief
var debrief = {
    data: {
        screen_id: "debrief"
    },
    type: "instructions",
    pages: [
        "<p>We have completed our experiment. </p>" +
        "<p>Please press next. </p>"
    ],
    show_clickable_nav: true,
};

// timeline
timeline = [];
timeline.push(welcome_block);
timeline.push(instruction_block);
// timeline.push(pract_procedure);
timeline.push(exp_instructions);
// timeline.push(exp_procedure);
timeline.push(debrief);

function startExp() {
    jsPsych.init({
        timeline: timeline,
        on_interaction_data_update: function(data) {
            // get the main trial data
            var trial = jsPsych.currentTrial();
            trial.data.screen_focus = data.event;
        },
        on_finish: function() {
            $.ajax({
                type: "POST",
                url: "/experiment-data",
                data: JSON.stringify(jsPsych.data.get().values()),
                contentType: "application/json"
            }).done(function() {
                window.location.href = "finish";
            }).fail(function() {
                alert("Problem occurred while writing data to Dropbox. " +
                    "Data will be saved to your computer. " +
                    "Please contact the experimenter regarding this issue!");
                var csv = jsPsych.data.get().csv();
                var filename = jsPsych.data.get().values()[0].part_ID + "_" + DATE + ".csv";
                downloadCSV(csv, filename);
                window.location.href = "finish";
            });
        }
    })
}