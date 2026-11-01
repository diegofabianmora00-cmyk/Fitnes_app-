const fs = require('fs');
const p = 'src/screens/Workout.js';
let s = fs.readFileSync(p, 'utf8');
const ringDef = "const Ring = ({ progress, center, C }) => (\n  <View style={{ alignItems: 'center', justifyContent: 'center' }}>\n    <Svg width={290} height={290}>\n      <Defs>\n        <SvgGrad id=\"ringGrad\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\">\n          <Stop offset=\"0\" stopColor={C.gradRing0} />\n          <Stop offset=\"1\" stopColor={C.gradRing1} />\n        </SvgGrad>\n      </Defs>\n      <Circle cx={145} cy={145} r={128} stroke={C.ringTrack} strokeWidth={14} fill=\"none\" />\n      <Circle cx={145} cy={145} r={128} stroke=\"url(#ringGrad)\" strokeWidth={14} fill=\"none\" strokeLinecap=\"round\"\n        strokeDasharray={`${Math.max(0, Math.min(1, progress)) * 804} 804`} transform=\"rotate(-90 145 145)\" />\n    </Svg>\n    <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>\n      {center}\n    </View>\n  </View>\n);";
const start = s.indexOf('  const Ring = ({ progress, center })');
if (start === -1) { console.log('no'); process.exit(); }
const endMarker = '  );\n\n';
const end = s.indexOf(endMarker, start);
if (end === -1) { console.log('no2'); process.exit(); }
s = s.slice(0, start) + ringDef + '\n' + s.slice(end + endMarker.length);
fs.writeFileSync(p, s);
console.log('ok');
