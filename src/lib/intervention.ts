import study from '../../public/data/tucson-intervention.json';
export const interventionStudy = study;
export function studyContrast(afterMW:number,corrected=true,beforeMW=1.38){
  const fit=corrected?study.analysis.corrected:study.analysis.raw;
  const powers=study.observations.map(o=>o.powerMW),lo=Math.min(...powers),hi=Math.max(...powers);
  if(!Number.isFinite(afterMW)||!Number.isFinite(beforeMW)||afterMW<lo||afterMW>hi||beforeMW<lo||beforeMW>hi)throw new RangeError('Keep the replay within the observed power range');
  const delta=afterMW-beforeMW,before=fit.intercept+fit.slopePerMW*beforeMW;
  const se=Math.abs(delta)*Math.sqrt(fit.coefficientCovariance[1][1]);
  const t=(fit.slopeCI95PerMW[1]-fit.slopePerMW)/fit.slopeStandardErrorPerMW;
  const change=fit.slopePerMW*delta;
  return{before,after:fit.intercept+fit.slopePerMW*afterMW,change,percent:100*change/before,ci95:[100*(change-t*se)/before,100*(change+t*se)/before],powerBeforeMW:beforeMW,powerAfterMW:afterMW,denominator:'Fixed fitted baseline; baseline uncertainty omitted',scope:'Within-study fitted satellite-sum contrast; not ground skyglow or star visibility'};
}
