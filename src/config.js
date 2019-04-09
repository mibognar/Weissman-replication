/*
    Configuration file for the various experiments.
    Each experiment contains variables and functions used in its setup and execution.
 */
const sharedCFG = {
    blocks: 1 + 4,
    trialsPerBlock: 80,
    trainingTrials: 24,
    interTrialInterval: 1000,
    trainingInterTrialInterval: 1500,
    maxRT: 1000,
    onResponse: function(kbEvent, stimDiv) {
        if(X.trials[X.trialNum].isPractice) {
            // Feedback stuff
            stimDiv.className = "feedback";
            if(!(kbEvent instanceof KeyboardEvent))
                stimDiv.innerHTML = S('g_r_too_slow').toUpperCase();
            else if(X.trials[X.trialNum].responseContent === X.trials[X.trialNum].responseTarget)
                stimDiv.innerHTML = S('g_r_correct').toUpperCase();
            else
                stimDiv.innerHTML = S('g_r_incorrect').toUpperCase();

            stimDiv.innerHTML += responseMapToHTML(X.responseMap, false);
            return X.cfg.trainingInterTrialInterval;
        }

        stimDiv.innerText = "";
        return X.cfg.interTrialInterval;
    },
    /**
     * Return a new congruency sequence balanced for sequential effects such that they are evenly partitioned
     * into 16 types. The types are represented with flags:
     * prev congruency | current congruency | feature set | stimulus
*
     * To prevent feature repetitions, alternating trials have different feature sets.
     * These sets are also balanced for in/congruency by stimulus within each set,
     * leaving 16 trial types which
     * must appear equally often.
*
     * This is cast as a graph theory problem where each node must be visited exactly n times.
     * A random path is generated by randomly selecting the next edge from the available options.
     * @param N {int} number of trials (should be divisible by 8
     * @param [plus1=true] {boolean} whether to add one trial of random type to the beginning
     * @param [reps=0] {int} iteration variable used to prevent recursion issues
     * @param [useWeights=true] {boolean}
     * @return {int[]|boolean} list of trial types or false on failure
     */
    getCongruencySequence: function(N, plus1 = true, reps = 0, useWeights = true) {

        // Stop infinite loops
        if(reps > 1000) {
            X.log("getCongruencySequence failed: recursion limit reached");
            return false;
        }

        let nTypes = 16;    // 16 different trial types
        let rngSplits = 2;  // 2 different RNG tracks (stimulus and everything else)
        let x = Math.floor(N/(nTypes / rngSplits));

        // Number of visits to each node remaining is a 1D array which can be addressed using flags
        let Ns = [];
        for(let i = 0; i < (nTypes / rngSplits); i++)
            Ns[i << 1] = x;

        let sum = function(X) {
           let sum = 0;
           X.forEach((x)=>sum += x);
           return sum;
        };

        // The specific stimulus for a trial is calculated orthogonally to the other properties
        // To achieve this, we make a randomised minilist for each congruency-stimulus set pairing
        let stims = [
            [               // Incongruent
                [], []      // Set 1, 2
            ],
            [               // Congruent
                [], []      // Set 1, 2
            ]
        ];
        for(let i = 0; i < N/(nTypes / rngSplits); i++)
            stims.forEach((c) =>
                c.forEach((s) =>
                    [0, 1].forEach((i) =>
                        s.push(i)
                    )
                )
            );
        stims = [
            [shuffle(stims[0][0]), shuffle(stims[0][1])],
            [shuffle(stims[1][0]), shuffle(stims[1][1])]
        ];

        // First trial has random prev and current congruency and stimulus set
        let trials = [
            ((Math.random() > .5? 1 : 0) << 3) +
            ((Math.random() > .5? 1 : 0) << 2) +
            ((Math.random() > .5? 1 : 0) << 1)
        ];
        if(!plus1)
            Ns[trials[trials.length-1]]--;
        // First trial has random stimulus within set
        trials[0] += Math.random() > .5? 1 : 0;

        // Build the rest of the trials
        while(sum(Ns) > 0) {
            let t = trials[trials.length-1];
            // Work out which nodes are connected by edges from here
            let options = [
                ((t & 4) << 1) + (0 << 2) + (2-(t & 2)),
                ((t & 4) << 1) + (1 << 2) + (2-(t & 2))
            ];

            // Random selection of next node
            let availableOptions = [];
            options.forEach((o)=> {
                if(Ns[o] > 0)
                    availableOptions.push(o);
            });

            // Try again if no options left
            if(availableOptions.length === 0) {
                // X.log("getCongruencySequence failed to identify weighted choice!");
                return sharedCFG.getCongruencySequence(N, plus1, reps + 1);
            }

            let choice;

            if(useWeights && availableOptions.length === 2) {
                // Selection weighted by counts of remaining trials
                const rng = getRandomInt(0, Ns[availableOptions[0]] + Ns[availableOptions[1]] - 1);

                choice = rng < Ns[options[0]]? availableOptions[0] : availableOptions[1];
            } else
                choice = availableOptions[getRandomInt(0, availableOptions.length - 1)];

            // Save the trial and append the stimulus choice
            trials.push(choice + stims[(4 & choice) >> 2][(2 & choice) >> 1].pop());
            Ns[choice]--;
        }
        if(reps > 100)
            X.log('Sequence generation for N=' + N + ' took >100 (' + (reps+1) + ') attempts.');

        return trials;
    }
};

const CFG = {
    flanker: {
        blocks: sharedCFG.blocks,
        trialsPerBlock: sharedCFG.trialsPerBlock,
        trainingTrials: sharedCFG.trainingTrials,
        interTrialInterval: sharedCFG.interTrialInterval,
        trainingInterTrialInterval: sharedCFG.trainingInterTrialInterval,
        maxRT: sharedCFG.maxRT,
        stimuli: [],
        responseKeys: [],
        stimDuration: 250,
        getResponseMap: function() {
            if(CFG.flanker.stimuli.length === 0)
                CFG.flanker.stimuli = ['g_s_M', 'g_s_S', 'g_s_T', 'g_s_H'];
            if(CFG.flanker.responseKeys.length === 0)
                CFG.flanker.responseKeys = ['m', 'n', 'x', 'c'];

            // Flanker task uses randomised stimulus pairings
            let stim = shuffle(CFG.flanker.stimuli);
            // Stimulus-response bindings are also randomised
            let response = shuffle(CFG.flanker.responseKeys);
            let out = {};
            for(let i = 0; i < stim.length; i++)
                out[stim[i]] = response[i];
            return out;
        },
        getTrials: function() {
            let set = [
                [CFG.flanker.stimuli[0], CFG.flanker.stimuli[1]],
                [CFG.flanker.stimuli[2], CFG.flanker.stimuli[3]]
            ];
            let trials = [];
            // Trial types is a list of flags from 0-15:
            // flag = (8*prevCongruency)+(4*curCongruency)+(2*featureSet)+(stimulus)
            for(let b = 0; b < CFG.flanker.blocks; b++) {
                let isPractice = b === 0? 1 : 0;
                let trialTypes = sharedCFG.getCongruencySequence(
                    isPractice? CFG.flanker.trainingTrials : CFG.flanker.trialsPerBlock, b > 0
                );
                trialTypes.forEach((t) => {
                    let trial = {
                        trialId: trials.length,
                        typeCode: t,
                        block: b,
                        isPractice,
                        responseTarget: K(X.responseMap[set[(t & 2) === 2? 1 : 0][t & 1]]),
                        isCongruent: (t & 4) === 4? 1 : 0,
                        stimOnset: null,
                        stimOffset: null,
                        responseTime: null,
                        responseContent: null
                    };
                    let target = set[(t & 2) === 2? 1 : 0][t & 1];
                    let flank = S(trial.isCongruent? target : set[(t & 2) === 2? 1 : 0][1-(t & 1)]);
                    trial.stimulus = flank.repeat(3) + S(target) + flank.repeat(3);
                    trials.push(trial);
                });
            }

            return trials;
        },
        showStimulus: function(stimDiv) {
            stimDiv.classList.add('flanker');
            stimDiv.innerText = X.trials[X.trialNum].stimulus;
            X.trials[X.trialNum].stimOnset = now();
            X.responseOpen = true;
            if(X.debug)
                X.responseTimeout = setTimeout(saveResponse, X.cfg.maxRT);

            setTimeout(CFG.flanker.hideStimulus, CFG.flanker.stimDuration, stimDiv);
        },
        hideStimulus: function(stimDiv) {
            stimDiv.classList.remove("flanker");
            if(X.trials[X.trialNum].isPractice) {
                stimDiv.classList.add("feedback");
                stimDiv.innerHTML = "<span class='fixation'>+</span>";
                stimDiv.innerHTML += responseMapToHTML(X.responseMap, false);
            } else
                stimDiv.innerHTML = "";
            if(X.trialNum < X.trials.length)
                X.trials[X.trialNum].stimOffset = now();
        },
        onResponse: sharedCFG.onResponse
    },
    primeprobe: {
        blocks: sharedCFG.blocks,
        trialsPerBlock: 96,
        trainingTrials: sharedCFG.trainingTrials,
        trainingInterTrialInterval: sharedCFG.trainingInterTrialInterval,
        maxRT: 1833, // 2s - 133ms - 33ms
        trialDuration: 2000,
        stimuli: [],
        responseKeys: [],
        primeDuration: 133,
        primeProbeGap: 33,
        probeDuration: 133,
        getResponseMap: function() {
            if(CFG.primeprobe.stimuli.length === 0)
                CFG.primeprobe.stimuli = ['g_s_left', 'g_s_right', 'g_s_up', 'g_s_down'];
            if(CFG.primeprobe.responseKeys.length === 0)
                CFG.primeprobe.responseKeys = ['f', 'g', 'j', 'n'];

            // primeprobe splits stimuli into left/right and up/down pairs
            // The stimulus-response bindings are constant
            let out = {};
            for(let i = 0; i < CFG.primeprobe.stimuli.length; i++)
                out[CFG.primeprobe.stimuli[i]] = CFG.primeprobe.responseKeys[i];
            return out;
        },
        getTrials: function() {
            let set = [
                [CFG.primeprobe.stimuli[0], CFG.primeprobe.stimuli[1]],
                [CFG.primeprobe.stimuli[2], CFG.primeprobe.stimuli[3]]
            ];
            let trials = [];
            // Trial types is a list of flags from 0-15:
            // flag = (8*prevCongruency)+(4*curCongruency)+(2*featureSet)+(stimulus)
            for(let b = 0; b < CFG.primeprobe.blocks; b++) {
                let isPractice = b === 0? 1 : 0;
                let trialTypes = sharedCFG.getCongruencySequence(
                    isPractice? CFG.primeprobe.trainingTrials : CFG.primeprobe.trialsPerBlock, b > 0
                );
                trialTypes.forEach((t) => {
                    let isCongruent = (t & 4) === 4? 1 : 0;
                    let probe = set[(t & 2) === 2 ? 1 : 0][t & 1];
                    let prime = isCongruent ? probe : set[(t & 2) === 2 ? 1 : 0][1 - (t & 1)];
                    let trial = {
                        trialId: trials.length,
                        typeCode: t,
                        block: b,
                        isPractice,
                        prime: S(prime),
                        probe: S(probe),
                        responseTarget: K(X.responseMap[probe]),
                        isCongruent,
                        primeOnset: null,
                        primeOffset: null,
                        probeOnset: null,
                        probeOffset: null,
                        responseTime: null,
                        responseContent: null
                    };
                    trials.push(trial);
                });
            }
            return trials;
        },
        showStimulus: function(stimDiv) {
            stimDiv.classList.add('primeprobe', 'prime');

            let s = X.trials[X.trialNum].prime;
            stimDiv.innerHTML = s + "<br/>" + s + "<br/>" + s;
            X.trials[X.trialNum].primeOnset = now();

            setTimeout(CFG.primeprobe.hidePrime, CFG.primeprobe.primeDuration, stimDiv);
        },
        hidePrime: function(stimDiv) {
            stimDiv.innerText = "";
            stimDiv.classList.remove('prime');

            if(X.trialNum < X.trials.length)
                X.trials[X.trialNum].primeOffset = now();

            setTimeout(CFG.primeprobe.showProbe, CFG.primeprobe.primeProbeGap, stimDiv);
        },
        showProbe: function(stimDiv) {
            stimDiv.classList.add('probe');
            stimDiv.innerText = X.trials[X.trialNum].probe;
            X.trials[X.trialNum].probeOnset = now();

            // Enable responding
            X.responseOpen = true;
            // Responding is open for as long as necessary, except in debug mode
            X.responseTimeout = setTimeout(saveResponse, X.cfg.maxRT);

            setTimeout(CFG.primeprobe.hideProbe, CFG.primeprobe.probeDuration, stimDiv);
        },
        hideProbe: function(stimDiv) {
            stimDiv.innerText = "";
            stimDiv.classList.remove('probe');
            if(X.trialNum < X.trials.length)
                X.trials[X.trialNum].probeOffset = now();
        },
        onResponse: function(kbEvent, stimDiv) {
            // Let the default function handle feedback
            sharedCFG.onResponse(kbEvent, stimDiv);
            // primeprobe trials are always 2s long, or 2s+1500 ITI in practice
            // (except in debug mode)
            if(X.debug)
                return 0;
            let ms = X.cfg.trialDuration;
            if(X.trials[X.trialNum].isPractice)
                ms += X.cfg.trainingInterTrialInterval;
            return ms - (now() - X.trials[X.trialNum].primeOnset);
        }
    },
    simon: {
        blocks: sharedCFG.blocks,
        trialsPerBlock: sharedCFG.trialsPerBlock,
        trainingTrials: sharedCFG.trainingTrials,
        interTrialInterval: sharedCFG.interTrialInterval,
        trainingInterTrialInterval: sharedCFG.trainingInterTrialInterval,
        maxRT: sharedCFG.maxRT,
        stimuliColours: [],
        responseKeys: [],
        stimDuration: 250,
        getResponseMap: function() {
            // simon task uses random stimulus colour pairs
            if(CFG.simon.stimuliColours.length === 0)
                CFG.simon.stimuliColours = shuffle([
                    'g_s_red',
                    'g_s_green',
                    'g_s_blue',
                    'g_s_yellow'
                ]);
            if(CFG.simon.responseKeys.length === 0)
                CFG.simon.responseKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

            // stimuli locations are divided into up/down and left/right pairs
            // response keys are bound to a random colour sharing the same axis
            let out = {};
            for(let i = 0; i < CFG.simon.stimuliColours.length; i++)
                out[CFG.simon.stimuliColours[i]] = CFG.simon.responseKeys[i];
            return out;
        },
        getTrials: function() {
            let set = [
                [CFG.simon.stimuliColours[0], CFG.simon.stimuliColours[1]],
                [CFG.simon.stimuliColours[2], CFG.simon.stimuliColours[3]]
            ];
            let trials = [];
            // Trial types is a list of flags from 0-15:
            // flag = (8*prevCongruency)+(4*curCongruency)+(2*featureSet)+(stimulus)
            for(let b = 0; b < CFG.simon.blocks; b++) {
                let isPractice = b === 0? 1 : 0;
                let trialTypes = sharedCFG.getCongruencySequence(
                    isPractice? CFG.simon.trainingTrials : CFG.simon.trialsPerBlock, b > 0
                );
                trialTypes.forEach((t) => {
                    let isCongruent = (t & 4) === 4? 1 : 0;
                    let stimColour = set[(t & 2) === 2 ? 1 : 0][t & 1];
                    let key = K(X.responseMap[isCongruent?
                        stimColour :
                        set[(t & 2) === 2 ? 1 : 0][1 - (t & 1)]]
                    );
                    let loc = key.substring(5).toLowerCase();

                    let trial = {
                        trialId: trials.length,
                        typeCode: t,
                        block: b,
                        isPractice,
                        stimClass: [stimColour, loc],
                        stimColour: S(stimColour),
                        stimLocation: S('g_s_' + loc),
                        responseTarget: K(X.responseMap[stimColour]),
                        isCongruent,
                        stimOnset: null,
                        stimOffset: null,
                        responseTime: null,
                        responseContent: null
                    };
                    trials.push(trial);
                });
            }
            return trials;
        },
        showStimulus: function(stimDiv) {
            stimDiv.classList.add('simon');
            X.trials[X.trialNum].stimClass.forEach(
                (c)=>{stimDiv.classList.add(c)}
                );

            X.trials[X.trialNum].stimOnset = now();
            X.responseOpen = true;
            // Responding is open for as long as necessary, except in debug mode
            if(X.debug)
                X.responseTimeout = setTimeout(saveResponse, X.cfg.maxRT);

            setTimeout(CFG.simon.hideStimulus, CFG.simon.stimDuration, stimDiv);
        },
        hideStimulus: function(stimDiv) {
            stimDiv.classList.remove("simon");
            if(X.trials[X.trialNum].isPractice) {
                stimDiv.classList.add("feedback");
                stimDiv.innerHTML = "<span class='fixation'>+</span>";
                stimDiv.innerHTML += responseMapToHTML(X.responseMap, false);
            } else
                stimDiv.innerHTML = "";
            if(X.trialNum < X.trials.length)
                X.trials[X.trialNum].stimOffset = now();
        },
        onResponse: sharedCFG.onResponse
    },
    stroop: {
        blocks: sharedCFG.blocks,
        trialsPerBlock: sharedCFG.trialsPerBlock,
        trainingTrials: sharedCFG.trainingTrials,
        interTrialInterval: sharedCFG.interTrialInterval,
        trainingInterTrialInterval: sharedCFG.trainingInterTrialInterval,
        maxRT: sharedCFG.maxRT,
        stimuliColours: [],
        responseKeys: [],
        getResponseMap: function() {
            // stroop task uses random stimulus colour pairs bound randomly to response keys
            if(CFG.stroop.stimuliColours.length === 0)
                CFG.stroop.stimuliColours = shuffle([
                    'g_s_red',
                    'g_s_green',
                    'g_s_blue',
                    'g_s_yellow'
                ]);
            if(CFG.stroop.responseKeys.length === 0)
                CFG.stroop.responseKeys = shuffle(['c', 'x', 'n', 'm']);

            let out = {};
            for(let i = 0; i < CFG.stroop.stimuliColours.length; i++)
                out[CFG.stroop.stimuliColours[i]] = CFG.stroop.responseKeys[i];
            return out;
        },
        getTrials: function() {
            let set = [
                [CFG.stroop.stimuliColours[0], CFG.stroop.stimuliColours[1]],
                [CFG.stroop.stimuliColours[2], CFG.stroop.stimuliColours[3]]
            ];
            let trials = [];
            // Trial types is a list of flags from 0-15:
            // flag = (8*prevCongruency)+(4*curCongruency)+(2*featureSet)+(stimulus)
            for(let b = 0; b < CFG.stroop.blocks; b++) {
                let isPractice = b === 0? 1 : 0;
                let trialTypes = sharedCFG.getCongruencySequence(
                    isPractice? CFG.stroop.trainingTrials : CFG.stroop.trialsPerBlock, b > 0
                );
                trialTypes.forEach((t) => {
                    let isCongruent = (t & 4) === 4? 1 : 0;
                    let stimColour = set[(t & 2) === 2 ? 1 : 0][t & 1];
                    let word = isCongruent? stimColour : set[(t & 2) === 2 ? 1 : 0][1-(t & 1)];

                    let trial = {
                        trialId: trials.length,
                        typeCode: t,
                        block: b,
                        isPractice,
                        stimClass: stimColour,
                        stimColour: S(stimColour),
                        stimWord: S(word),
                        responseTarget: K(X.responseMap[stimColour]),
                        isCongruent,
                        stimOnset: null,
                        responseTime: null,
                        responseContent: null
                    };
                    trials.push(trial);
                });
            }
            return trials;
        },
        showStimulus: function(stimDiv) {
            stimDiv.classList.add('stroop', X.trials[X.trialNum].stimClass);
            stimDiv.innerText = X.trials[X.trialNum].stimWord;

            X.trials[X.trialNum].stimOnset = now();
            X.responseOpen = true;
            // Responding is open for as long as necessary, except in debug mode
            if(X.debug)
                X.responseTimeout = setTimeout(saveResponse, X.cfg.maxRT);
        },
        onResponse: sharedCFG.onResponse
    }
};