import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');

const HTML_CONTENT = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Horloge Dorée</title>
    <style>
        :root {
            --clock-size: min(90vw, 90vh, 400px);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            overflow: hidden;
            font-family: 'Georgia', serif;
            background: transparent;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
            position: relative;
        }

        .clock-container {
            position: relative;
            width: var(--clock-size);
            height: var(--clock-size);
        }

        .second-graduation-circle {
            position: absolute;
            top: 50%;
            left: 50%;
            width: calc(var(--clock-size) * 0.8667);
            height: calc(var(--clock-size) * 0.8667);
            border-radius: 50%;
            border: calc(var(--clock-size) * 0.00445) solid #FFD700;
            transform: translate(-50%, -50%);
            box-shadow: 0 0 calc(var(--clock-size) * 0.033) rgba(255, 215, 0, 0.3);
        }

        .first-graduation-circle {
            position: absolute;
            top: 50%;
            left: 50%;
            width: calc(var(--clock-size) * 0.7333);
            height: calc(var(--clock-size) * 0.7333);
            border-radius: 50%;
            border: calc(var(--clock-size) * 0.00445) solid #FFD700;
            transform: translate(-50%, -50%);
            box-shadow: 0 0 calc(var(--clock-size) * 0.033) rgba(255, 215, 0, 0.3);
        }

        .clock {
            position: absolute;
            top: 50%;
            left: 50%;
            width: calc(var(--clock-size) * 0.625);
            height: calc(var(--clock-size) * 0.625);
            border-radius: 50%;
            background: radial-gradient(circle at 30% 30%, rgba(255, 223, 128, 0.15), rgba(139, 90, 43, 0.1));
            box-shadow:
                0 0 calc(var(--clock-size) * 0.1) rgba(255, 215, 0, 0.4),
                inset 0 0 calc(var(--clock-size) * 0.133) rgba(255, 215, 0, 0.03),
                0 0 calc(var(--clock-size) * 0.2) rgba(255, 215, 0, 0.2);
            border: calc(var(--clock-size) * 0.00445) solid #FFD700;
            transform: translate(-50%, -50%);
            animation: clock-glow 3s infinite alternate;
        }

        @keyframes clock-glow {
            0% {
                box-shadow:
                    0 0 calc(var(--clock-size) * 0.1) rgba(255, 215, 0, 0.4),
                    inset 0 0 calc(var(--clock-size) * 0.133) rgba(255, 215, 0, 0.03),
                    0 0 calc(var(--clock-size) * 0.2) rgba(255, 215, 0, 0.2);
            }
            100% {
                box-shadow:
                    0 0 calc(var(--clock-size) * 0.133) rgba(255, 215, 0, 0.6),
                    inset 0 0 calc(var(--clock-size) * 0.167) rgba(255, 215, 0, 0.05),
                    0 0 calc(var(--clock-size) * 0.25) rgba(255, 215, 0, 0.3);
            }
        }

        .clock-center {
            position: absolute;
            top: 50%;
            left: 50%;
            width: calc(var(--clock-size) * 0.0333);
            height: calc(var(--clock-size) * 0.0333);
            background: #FFD700;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            box-shadow: 0 0 calc(var(--clock-size) * 0.0333) rgba(255, 215, 0, 0.8);
            z-index: 4;
        }

        .clock-center-inner {
            position: absolute;
            top: 50%;
            left: 50%;
            width: calc(var(--clock-size) * 0.0167);
            height: calc(var(--clock-size) * 0.0167);
            background: #000000;
            border-radius: 50%;
            transform: translate(-50%, -50%);
        }

        .top-circle-base {
            position: absolute;
            top: 50%;
            left: 50%;
            width: calc(var(--clock-size) * 0.0133);
            height: calc(var(--clock-size) * 0.0133);
            background: #FFD700;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            box-shadow: 0 0 calc(var(--clock-size) * 0.0083) rgba(255, 215, 0, 0.6);
            z-index: 6;
        }

        .top-circle-base-inner {
            position: absolute;
            top: 50%;
            left: 50%;
            width: calc(var(--clock-size) * 0.0067);
            height: calc(var(--clock-size) * 0.0067);
            background: #000000;
            border-radius: 50%;
            transform: translate(-50%, -50%);
        }

        .hour-number {
            position: absolute;
            font-size: calc(var(--clock-size) * 0.0467);
            font-weight: bold;
            color: #FFD700;
            text-shadow:
                0 0 calc(var(--clock-size) * 0.0167) rgba(255, 215, 0, 0.8),
                0 0 calc(var(--clock-size) * 0.0333) rgba(255, 215, 0, 0.5);
            font-family: 'Georgia', serif;
        }

        .hour-mark {
            position: absolute;
            width: calc(var(--clock-size) * 0.005);
            height: calc(var(--clock-size) * 0.025);
            top: 50%;
            left: 50%;
            background: #FFD700;
            border-radius: 1px;
            box-shadow: 0 0 calc(var(--clock-size) * 0.0083) rgba(255, 215, 0, 0.6);
            margin-left: calc(var(--clock-size) * -0.0025);
            margin-top: calc(var(--clock-size) * -0.0125);
            transform-origin: center center;
        }

        .small-mark {
            position: absolute;
            width: calc(var(--clock-size) * 0.0033);
            height: calc(var(--clock-size) * 0.0133);
            top: 50%;
            left: 50%;
            background: #FFD700;
            border-radius: 1px;
            opacity: 0.7;
            margin-left: calc(var(--clock-size) * -0.00167);
            margin-top: calc(var(--clock-size) * -0.00667);
            transform-origin: center center;
        }

        .tiny-mark {
            position: absolute;
            width: calc(var(--clock-size) * 0.0025);
            height: calc(var(--clock-size) * 0.0083);
            top: 50%;
            left: 50%;
            background: #FFD700;
            border-radius: 1px;
            opacity: 0.6;
            margin-left: calc(var(--clock-size) * -0.00125);
            margin-top: calc(var(--clock-size) * -0.00417);
            transform-origin: center center;
        }

        .minute-number {
            position: absolute;
            font-size: calc(var(--clock-size) * 0.0167);
            font-weight: normal;
            color: #FFD700;
            text-shadow: 0 0 calc(var(--clock-size) * 0.005) rgba(255, 215, 0, 0.5);
            font-family: 'Arial', sans-serif;
        }

        .top-circle {
            position: absolute;
            width: calc(var(--clock-size) * 0.2);
            height: calc(var(--clock-size) * 0.2);
            border-radius: 50%;
            background: transparent;
            border: calc(var(--clock-size) * 0.0033) solid #FFD700;
            box-shadow: 0 0 calc(var(--clock-size) * 0.0167) rgba(255, 215, 0, 0.6);
        }

        .top-circle-hand {
            position: absolute;
            bottom: 50%;
            left: 50%;
            width: calc(var(--clock-size) * 0.0025);
            height: calc(var(--clock-size) * 0.0833);
            background: #FFD700;
            margin-left: calc(var(--clock-size) * -0.00125);
            transform-origin: center bottom;
            border-radius: 50px;
            box-shadow:
                0 0 calc(var(--clock-size) * 0.0167) rgba(255, 215, 0, 0.8),
                0 0 calc(var(--clock-size) * 0.0333) rgba(255, 215, 0, 0.4);
            z-index: 5;
        }

        .top-circle-mark {
            position: absolute;
            width: calc(var(--clock-size) * 0.00167);
            height: calc(var(--clock-size) * 0.005);
            background: #FFD700;
            border-radius: 1px;
            opacity: 0.8;
        }

        .top-circle-number {
            position: absolute;
            font-size: calc(var(--clock-size) * 0.0133);
            font-weight: bold;
            color: #FFD700;
            text-shadow: 0 0 calc(var(--clock-size) * 0.005) rgba(255, 215, 0, 0.5);
            font-family: 'Arial', sans-serif;
        }

        .section-line {
            position: absolute;
            width: calc(var(--clock-size) * 0.0033);
            height: calc(var(--clock-size) * 0.0667);
            top: 50%;
            left: 50%;
            background: #FFD700;
            border-radius: 1px;
            margin-left: calc(var(--clock-size) * -0.00167);
            margin-top: calc(var(--clock-size) * -0.0333);
            transform-origin: center center;
            box-shadow: 0 0 calc(var(--clock-size) * 0.0083) rgba(255, 215, 0, 0.6);
        }

        .hand {
            position: absolute;
            bottom: 50%;
            left: 50%;
            transform-origin: center bottom;
            border-radius: 50px;
            z-index: 3;
        }

        .hour-hand {
            width: calc(var(--clock-size) * 0.0133);
            height: calc(var(--clock-size) * 0.1833);
            background: #FFD700;
            margin-left: calc(var(--clock-size) * -0.00667);
            box-shadow:
                0 0 calc(var(--clock-size) * 0.025) rgba(255, 215, 0, 0.8),
                0 0 calc(var(--clock-size) * 0.0417) rgba(255, 215, 0, 0.4);
            z-index: 3;
        }

        .minute-hand {
            width: calc(var(--clock-size) * 0.01);
            height: calc(var(--clock-size) * 0.25);
            background: #FFD700;
            margin-left: calc(var(--clock-size) * -0.005);
            box-shadow:
                0 0 calc(var(--clock-size) * 0.025) rgba(255, 215, 0, 0.8),
                0 0 calc(var(--clock-size) * 0.0417) rgba(255, 215, 0, 0.4);
            z-index: 2;
        }

        .second-hand {
            width: calc(var(--clock-size) * 0.005);
            height: calc(var(--clock-size) * 0.2833);
            background: #FFD700;
            margin-left: calc(var(--clock-size) * -0.0025);
            box-shadow:
                0 0 calc(var(--clock-size) * 0.025) rgba(255, 215, 0, 0.8),
                0 0 calc(var(--clock-size) * 0.0417) rgba(255, 215, 0, 0.6);
            z-index: 1;
        }

        .digital-display {
            position: absolute;
            bottom: calc(var(--clock-size) * 0.0667);
            left: 50%;
            transform: translateX(-50%);
            font-size: calc(var(--clock-size) * 0.03);
            color: #FFD700;
            text-shadow: 0 0 calc(var(--clock-size) * 0.0167) rgba(255, 215, 0, 0.8);
            font-family: 'Courier New', monospace;
            font-weight: bold;
            letter-spacing: calc(var(--clock-size) * 0.0033);
        }
    </style>
</head>
<body>
    <div class="clock-container">
        <div class="second-graduation-circle" id="secondGraduationCircle"></div>
        <div class="first-graduation-circle" id="firstGraduationCircle"></div>

        <div class="clock" id="clock">
            <div id="redCircleGraduations" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></div>

            <div class="top-circle" id="topCircle">
                <div class="top-circle-hand" id="topCircleHand"></div>
                <div class="top-circle-base">
                    <div class="top-circle-base-inner"></div>
                </div>
            </div>

            <div id="hourNumbers" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></div>

            <div class="hand hour-hand" id="hourHand"></div>
            <div class="hand minute-hand" id="minuteHand"></div>
            <div class="hand second-hand" id="secondHand"></div>

            <div class="clock-center">
                <div class="clock-center-inner"></div>
            </div>
            <div class="digital-display" id="digitalDisplay"></div>
        </div>
    </div>

    <script>
        let redCircleRotation = 0;
        let blueCircleRotation = 0;
        let secondCircleRotation = 0;

        function getClockSize() {
            const container = document.querySelector('.clock-container');
            return container.offsetWidth;
        }

        function createHourNumbers() {
            const clockSize = getClockSize();
            const numbersContainer = document.getElementById('secondGraduationCircle');
            const centerOffset = clockSize * 0.4333;
            const radiusNumbers = clockSize * 0.4017;

            for (let i = 1; i <= 12; i++) {
                const number = document.createElement('div');
                number.className = 'hour-number';
                number.textContent = i;

                const angle = (i * 30 - 90) * (Math.PI / 180);
                const x = centerOffset + radiusNumbers * Math.cos(angle);
                const y = centerOffset + radiusNumbers * Math.sin(angle);

                number.style.left = x + 'px';
                number.style.top = y + 'px';
                number.style.transform = 'translate(-50%, -50%)';

                numbersContainer.appendChild(number);
            }

            const topCircle = document.getElementById('topCircle');
            const mainClockRadius = clockSize * 0.3125;
            const radiusTopCircle = (clockSize * 0.2167) - (clockSize * 0.05);
            const angleTop = -90 * (Math.PI / 180);

            const xTop = mainClockRadius + radiusTopCircle * Math.cos(angleTop);
            const yTop = mainClockRadius + radiusTopCircle * Math.sin(angleTop);

            topCircle.style.left = xTop + 'px';
            topCircle.style.top = yTop + 'px';
            topCircle.style.transform = 'translate(-50%, -50%)';
        }

        function createTopCircleMarks() {
            const clockSize = getClockSize();
            const topCircle = document.getElementById('topCircle');
            const topCircleSize = clockSize * 0.2;
            const centerX = topCircleSize / 2;
            const centerY = topCircleSize / 2;
            const radius = topCircleSize / 2;

            const totalTraits = 26;
            const angleStep = 360 / totalTraits;

            for (let i = 0; i < totalTraits; i++) {
                const mark = document.createElement('div');
                mark.className = 'top-circle-mark';

                const angleDeg = i * angleStep;
                const angleRad = (angleDeg - 90) * (Math.PI / 180);

                const x = centerX + radius * Math.cos(angleRad);
                const y = centerY + radius * Math.sin(angleRad);

                mark.style.left = x + 'px';
                mark.style.top = y + 'px';
                mark.style.transformOrigin = 'center center';
                mark.style.transform = \`translate(-50%, -50%) rotate(\${angleDeg}deg)\`;

                topCircle.appendChild(mark);
            }
        }

        function createTopCircleNumbers() {
            const clockSize = getClockSize();
            const topCircle = document.getElementById('topCircle');
            const topCircleSize = clockSize * 0.2;
            const centerX = topCircleSize / 2;
            const centerY = topCircleSize / 2;
            const radiusNumbers = clockSize * 0.075;

            for (let i = 1; i <= 12; i++) {
                const number = document.createElement('div');
                number.className = 'top-circle-number';
                number.textContent = i;

                const angle = (i * 30 - 90) * (Math.PI / 180);
                const x = centerX + radiusNumbers * Math.cos(angle);
                const y = centerY + radiusNumbers * Math.sin(angle);

                number.style.left = x + 'px';
                number.style.top = y + 'px';
                number.style.transform = 'translate(-50%, -50%)';

                topCircle.appendChild(number);
            }
        }

        function createHourMarks() {
            const clockSize = getClockSize();
            const blueCircle = document.getElementById('firstGraduationCircle');
            const firstCircleSize = clockSize * 0.7333;
            const centerX = firstCircleSize / 2;
            const centerY = firstCircleSize / 2;
            const radiusNumbers = clockSize * 0.3317;
            const distanceFromCenter = clockSize * 0.3533;

            for (let i = 1; i <= 12; i++) {
                const mark = document.createElement('div');
                mark.className = 'hour-mark';

                const angleDeg = i * 30;
                const angleRad = (angleDeg - 90) * (Math.PI / 180);

                mark.style.transform = \`rotate(\${angleDeg}deg) translateY(-\${distanceFromCenter}px)\`;

                blueCircle.appendChild(mark);

                const number = document.createElement('div');
                number.className = 'minute-number';
                number.textContent = i * 5;

                const xNum = centerX + radiusNumbers * Math.cos(angleRad);
                const yNum = centerY + radiusNumbers * Math.sin(angleRad);

                number.style.left = xNum + 'px';
                number.style.top = yNum + 'px';
                number.style.transform = 'translate(-50%, -50%)';

                blueCircle.appendChild(number);
            }
        }

        function createSectionLines() {
            const clockSize = getClockSize();
            const secondCircle = document.getElementById('secondGraduationCircle');
            const distanceFromCenter = clockSize * 0.4;

            for (let i = 0; i < 12; i++) {
                const line = document.createElement('div');
                line.className = 'section-line';

                const angleDeg = i * 30 + 15;

                line.style.transform = \`rotate(\${angleDeg}deg) translateY(-\${distanceFromCenter}px)\`;

                secondCircle.appendChild(line);
            }
        }

        function createSmallMarks() {
            const clockSize = getClockSize();
            const blueCircle = document.getElementById('firstGraduationCircle');
            const firstCircleSize = clockSize * 0.7333;
            const centerX = firstCircleSize / 2;
            const centerY = firstCircleSize / 2;
            const radiusNumbers = clockSize * 0.3317;
            const distanceFromCenter = clockSize * 0.3567;

            for (let minute = 1; minute <= 60; minute++) {
                if (minute % 5 === 0) continue;

                const mark = document.createElement('div');
                mark.className = 'small-mark';

                const angleDeg = minute * 6;
                const angleRad = (angleDeg - 90) * (Math.PI / 180);

                mark.style.transform = \`rotate(\${angleDeg}deg) translateY(-\${distanceFromCenter}px)\`;

                blueCircle.appendChild(mark);

                const number = document.createElement('div');
                number.className = 'minute-number';
                number.textContent = minute;

                const xNum = centerX + radiusNumbers * Math.cos(angleRad);
                const yNum = centerY + radiusNumbers * Math.sin(angleRad);

                number.style.left = xNum + 'px';
                number.style.top = yNum + 'px';
                number.style.transform = 'translate(-50%, -50%)';

                blueCircle.appendChild(number);
            }
        }

        function createTinyMarks() {
            const clockSize = getClockSize();
            const redCircle = document.getElementById('redCircleGraduations');
            const distanceFromCenter = clockSize * 0.3083;

            const totalTraitsPerSection = 11;
            const angleStep = 30 / totalTraitsPerSection;

            for (let i = 0; i < 12; i++) {
                const startAngle = i * 30;

                for (let j = 0; j < totalTraitsPerSection; j++) {
                    const mark = document.createElement('div');
                    mark.className = 'tiny-mark';

                    const angleDeg = startAngle + (j * angleStep);

                    mark.style.transform = \`rotate(\${angleDeg}deg) translateY(-\${distanceFromCenter}px)\`;

                    redCircle.appendChild(mark);
                }
            }
        }

        function rotateCercles() {
            redCircleRotation -= 0.5;
            document.getElementById('redCircleGraduations').style.transform = \`rotate(\${redCircleRotation}deg)\`;

            const minuteNumbers = document.querySelectorAll('.minute-number');
            minuteNumbers.forEach(number => {
                if (number.parentElement.id !== 'firstGraduationCircle') {
                    number.style.transform = \`translate(-50%, -50%) rotate(\${-redCircleRotation}deg)\`;
                }
            });

            blueCircleRotation += 0.5;
            document.getElementById('firstGraduationCircle').style.transform = \`translate(-50%, -50%) rotate(\${blueCircleRotation}deg)\`;

            const blueCircleNumbers = document.getElementById('firstGraduationCircle').querySelectorAll('.minute-number');
            blueCircleNumbers.forEach(number => {
                number.style.transform = \`translate(-50%, -50%) rotate(\${-blueCircleRotation}deg)\`;
            });

            secondCircleRotation -= 0.5;
            document.getElementById('secondGraduationCircle').style.transform = \`translate(-50%, -50%) rotate(\${secondCircleRotation}deg)\`;

            const hourNumbers = document.querySelectorAll('.hour-number');
            hourNumbers.forEach(number => {
                number.style.transform = \`translate(-50%, -50%) rotate(\${-secondCircleRotation}deg)\`;
            });
        }

        function updateClock() {
            const now = new Date();
            const seconds = now.getSeconds();
            const milliseconds = now.getMilliseconds();
            const minutes = now.getMinutes();
            const hours = now.getHours() % 12;

            const secondAngle = seconds * 6;
            const minuteAngle = minutes * 6 + seconds * 0.1;
            const hourAngle = hours * 30 + minutes * 0.5;

            document.getElementById('secondHand').style.transform = \`rotate(\${secondAngle}deg)\`;
            document.getElementById('minuteHand').style.transform = \`rotate(\${minuteAngle}deg)\`;
            document.getElementById('hourHand').style.transform = \`rotate(\${hourAngle}deg)\`;

            const totalMilliseconds = seconds * 1000 + milliseconds;
            const thirdSecondSteps = Math.floor(totalMilliseconds / 333.33);
            const topCircleAngle = thirdSecondSteps * 4;
            document.getElementById('topCircleHand').style.transform = \`rotate(\${topCircleAngle}deg)\`;

            const digitalTime = String(now.getHours()).padStart(2, '0') + ':' +
                              String(now.getMinutes()).padStart(2, '0') + ':' +
                              String(now.getSeconds()).padStart(2, '0');
            document.getElementById('digitalDisplay').textContent = digitalTime;
        }

        createHourNumbers();
        createSectionLines();
        createHourMarks();
        createSmallMarks();
        createTinyMarks();
        createTopCircleMarks();
        createTopCircleNumbers();
        updateClock();

        setInterval(updateClock, 100);
        setInterval(rotateCercles, 200);
    </script>
</body>
</html>
`;

export const GoldenClock: React.FC = () => {
  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: HTML_CONTENT }}
        style={styles.webview}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        bounces={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width,
    height: width, // Carré pour maintenir les proportions
    maxHeight: 400,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
