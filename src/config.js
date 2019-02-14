/*
    Configuration file for the various experiments.
    Each experiment contains variables and functions used in its setup and execution.
 */
const sharedCFG = {
    blocks: 4,
    trialsPerBlock: 80,
    trainingTrials: 32,
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

            stimDiv.innerHTML += "<br/>" + responseMapToHTML(X.responseMap);
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
     * A random path is generated by selecting the next edge from the available options using a
     * weighting relative to the number of visits to the candidate node remaining.
     * @param {int} N number of trials (should be divisible by 16
     * @param {boolean} [plus1=true] whether to add one trial of random type to the beginning
     * @param {int} [reps=0] iteration variable used to prevent recursion issues
     * @return {int[]|boolean} list of trial types or false on failure
     */
    getCongruencySequence: function(N, plus1 = true, reps = 0) {
        // Stop infinite loops
        if(reps > 1000) {
            X.log("getCongruencySequence failed: recursion limit reached");
            return false;
        }

        let x = Math.floor(N/16);
        // Number of visits to each node remaining is a 1D array which can be addressed using flags
        let Ns = [];
        for(let i = 0; i < 16; i++)
            Ns.push(x);

        let sum = function(X) {
           let sum = 0;
           X.forEach((x)=>sum += x);
           return sum;
        };

        // First trial has random prev and current congruency (Could just be a random int from 0-15)
        let trials = [
            ((Math.random() > .5? 1 : 0) << 3) +
            ((Math.random() > .5? 1 : 0) << 2) +
            ((Math.random() > .5? 1 : 0) << 1) +
            (Math.random() > .5? 1 : 0)
        ];
        if(!plus1)
            Ns[trials[trials.length-1]]--;

        while(sum(Ns) > 0) {
            let t = trials[trials.length-1];
            // Work out which nodes are connected by edges from here
            let options = [
                ((t & 4) << 1) + (0 << 2) + (2-(t & 2)) + 0,
                ((t & 4) << 1) + (1 << 2) + (2-(t & 2)) + 0,
                ((t & 4) << 1) + (0 << 2) + (2-(t & 2)) + 1,
                ((t & 4) << 1) + (1 << 2) + (2-(t & 2)) + 1
            ];
            // Weighted random selection of next node
            let rawWeights = [];
            let weights = [];
            options.forEach((o)=> rawWeights.push(Ns[o]));
            // Normalise weights
            let weightSum = sum(rawWeights);
            // Look for a new path if this is a dead end
            if(!weightSum)
                return sharedCFG.getCongruencySequence(N, reps + 1);
            rawWeights.forEach((w)=> weights.push(w/weightSum));

            let choice = false;
            let r = Math.random();
            for(let i = 0; i < weights.length; i++) {
                if(r < weights[i])
                    choice = i;
                else
                    r -= weights[i];
            }
            if(choice === false) {
                X.log("getCongruencySequence failed to identify weighted choice!");
                return sharedCFG.getCongruencySequence(N, plus1, reps + 1);
            }

            trials.push(options[choice]);
            Ns[options[choice]]--;
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
                CFG.flanker.stimuli = [S('g_s_M'), S('g_s_S'), S('g_s_T'), S('g_s_H')];
            if(CFG.flanker.responseKeys.length === 0)
                CFG.flanker.responseKeys = [K('m'), K('n'), K('x'), K('z')];

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
                    isPractice? CFG.flanker.trainingTrials : CFG.flanker.trialsPerBlock
                );
                trialTypes.forEach((t) => {
                    let trial = {
                        trialId: trials.length,
                        typeCode: t,
                        block: b,
                        isPractice,
                        responseTarget: X.responseMap[set[(t & 2) === 2? 1 : 0][t & 1]],
                        isCongruent: (t & 4) === 4? 1 : 0,
                        stimOnset: null,
                        stimOffset: null,
                        responseTime: null,
                        responseContent: null
                    };
                    let target = set[(t & 2) === 2? 1 : 0][t & 1];
                    let flank = trial.isCongruent? target : set[(t & 2) === 2? 1 : 0][1-(t & 1)];
                    trial.stimulus = flank.repeat(3) + target + flank.repeat(3);
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
                CFG.primeprobe.stimuli = [S('g_s_left'), S('g_s_right'), S('g_s_up'), S('g_s_down')];
            if(CFG.primeprobe.responseKeys.length === 0)
                CFG.primeprobe.responseKeys = [K('f'), K('g'), K('n'), K('m')];

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
                    isPractice? CFG.primeprobe.trainingTrials : CFG.primeprobe.trialsPerBlock
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
                        prime,
                        probe,
                        responseTarget: X.responseMap[probe],
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
                CFG.simon.stimuliColours = shuffle(['red', 'green', 'blue', 'yellow']);
            if(CFG.simon.responseKeys.length === 0)
                CFG.simon.responseKeys = [K('ArrowUp'), K('ArrowDown'), K('ArrowLeft'), K('ArrowRight')];

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
                    isPractice? CFG.simon.trainingTrials : CFG.simon.trialsPerBlock
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
                        stimColour,
                        stimLocation: loc,
                        responseTarget: X.responseMap[stimColour],
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
            stimDiv.classList.add('simon',
                X.trials[X.trialNum].stimColour,
                X.trials[X.trialNum].stimLocation);

            X.trials[X.trialNum].stimOnset = now();
            X.responseOpen = true;
            // Responding is open for as long as necessary, except in debug mode
            if(X.debug)
                X.responseTimeout = setTimeout(saveResponse, X.cfg.maxRT);

            setTimeout(CFG.simon.hideStimulus, CFG.simon.stimDuration, stimDiv);
        },
        hideStimulus: function(stimDiv) {
            stimDiv.classList.remove("simon");
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
                CFG.stroop.stimuliColours = shuffle(['red', 'green', 'blue', 'yellow']);
            if(CFG.stroop.responseKeys.length === 0)
                CFG.stroop.responseKeys = shuffle([K('z'), K('x'), K('n'), K('m')]);

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
                    isPractice? CFG.stroop.trainingTrials : CFG.stroop.trialsPerBlock
                );
                trialTypes.forEach((t) => {
                    let isCongruent = (t & 4) === 4? 1 : 0;
                    let stimColour = set[(t & 2) === 2 ? 1 : 0][t & 1];
                    let word = isCongruent? stimColour : set[(t & 2) === 2 ? 1 : 0][1-(t & 1)];
                    let stimWord = S('g_s_' + word);

                    let trial = {
                        trialId: trials.length,
                        typeCode: t,
                        block: b,
                        isPractice,
                        stimColour,
                        stimWord,
                        responseTarget: X.responseMap[stimColour],
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
            stimDiv.classList.add('stroop', X.trials[X.trialNum].stimColour);
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