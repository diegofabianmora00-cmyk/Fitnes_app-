const fs=require('fs');
const p='src/screens/Workout.js';
let s=fs.readFileSync(p,'utf8');
const ringDef = "const Ring = ({ progress, center, C }) => (\n  <View style={{ alignItems: 'center', justifyContent: 'center' }}>\n    <Svg width={290} height={290}>\n      <Defs>\n        <SvgGrad id=\"ringGrad\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\">\n          <Stop offset=\"0\" stopColor={C.gradRing0} />\n          <Stop offset=\"1\" stopColor={C.gradRing1} />\n        </SvgGrad>\n      </Defs>\n      <Circle cx={145} cy={145} r={128} stroke={C.ringTrack} strokeWidth={14} fill=\"none\" />\n      <Circle cx={145} cy={145} r={128} stroke=\"url(#ringGrad)\" strokeWidth={14} fill=\"none\" strokeLinecap=\"round\"\n        strokeDasharray={`${Math.max(0, Math.min(1, progress)) * 804} 804`} transform=\"rotate(-90 145 145)\" />\n    </Svg>\n    <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>\n      {center}\n    </View>\n  </View>\n);";
if(s.indexOf('const Ring = ({ progress, center, C })')===-1 && s.indexOf('const Ring = ({ progress, center }')!==-1){
  // remove old inside component
  // easier to just replace usages to pass C and keep old? Or better move outside
}
if(s.indexOf('const Ring = ({ progress, center }')===-1){
  s = s.replace("const mm = (s) => `${Math.floor(s / 60)}:${String(Math.abs(Math.floor(s)) % 60).padStart(2, '0')}`;\n\n",
    "const mm = (s) => `${Math.floor(s / 60)}:${String(Math.abs(Math.floor(s)) % 60).padStart(2, '0')}`;\n\n"+ringDef+"\n\n");
  fs.writeFileSync(p,s);
  console.log('added');
}else{
  console.log('has');
}
