export function approvalsView(){return `<div class="workspace-head"><div><h1>Approvals</h1><p>Review proposed remediation actions and closure requests.</p></div><button class="request" data-action="reviewer">Switch to Daniel Kim - reviewer</button></div><section class="panel page-panel"><div class="approval-summary"><span class="status-dot"></span><b id="approvalCount">Loading approval queue</b><span class="muted">Independent review keeps closure decisions trustworthy.</span></div><div class="approval-list" id="approvalList"><div class="empty">Loading approval requests</div></div></section>`}

export async function bindApprovals(root,{notify,api}){
  const list=root.querySelector('#approvalList');
  const me=await api('/api/v1/me').catch(()=>({user:{},permissions:[]}));
  const canApprove=(me.permissions||[]).includes('actions:approve');
  const switchButton=root.querySelector('[data-action="reviewer"]');
  if(switchButton&&me.user?.role==='compliance_reviewer') switchButton.classList.add('hidden');
  const load=async()=>{
    try{
      const result=await api('/api/v1/approvals');
      const count=result.items?.length||0;
      root.querySelector('#approvalCount').textContent=`${count} request${count===1?'':'s'} waiting`;
      const navBadge=document.querySelector('.nav-item[data-view="approvals"] em');
      if(navBadge)navBadge.textContent=count;
      list.innerHTML=(result.items||[]).map(item=>{
        const reviewerControls=canApprove
          ? `<div class="review-controls"><div class="review-checks"><label><input type="checkbox" data-check="evidenceReviewed" /> Evidence reviewed</label><label><input type="checkbox" data-check="acceptanceCriteriaMet" /> Acceptance criteria met</label><label><input type="checkbox" data-check="independentReviewerConfirmed" /> Independent reviewer confirmed</label></div><div class="approval-actions"><button class="approve" data-action="approve" disabled>Approve and close</button><button class="request" data-action="reject">Request changes</button></div></div>`
          : `<div class="review-controls review-waiting"><span class="muted">Waiting for an independent reviewer to verify this request.</span></div>`;
        return `<article class="approval-row" data-approval-id="${item.id}"><div><span class="badge approval">Human approval required</span><h2>${item.issueKey} - ${item.action}</h2><p>Requested by ${item.requester||'Issue owner'} - Issue version ${item.issueVersion} - Expires ${new Date(item.expiresAt).toLocaleDateString()}</p><div class="proposal-line"><b>Issue:</b> ${item.issue||'Compliance remediation'} <span class="muted"> - Pending independent review</span></div><div class="approval-evidence"><b>Evidence:</b> ${item.evidenceState?.ready?'Ready for verification':item.evidenceState?.quarantined?'Scanning in progress':'Missing evidence'}</div></div>${reviewerControls}</article>`;
      }).join('')||'<div class="empty">You are all caught up. No approval requests need review.</div>';
      bindActions();
    }catch(error){list.innerHTML='<div class="empty">Approval queue could not be loaded for this account.</div>';notify(error.message)}
  };
  const bindActions=()=>{
    list.querySelectorAll('[data-action="approve"]').forEach(button=>button.addEventListener('click',async()=>{
      const card=button.closest('[data-approval-id]');
      const checks=Object.fromEntries([...card.querySelectorAll('[data-check]')].map(input=>[input.dataset.check,input.checked]));
      try{await api(`/api/v1/approvals/${card.dataset.approvalId}/decision`,{method:'POST',body:JSON.stringify({decision:'approved',checks})});notify('Approval recorded and the issue was closed.');load()}catch(error){notify(error.message)}
    }));
    list.querySelectorAll('[data-approval-id]').forEach(card=>card.querySelectorAll('[data-check]').forEach(input=>input.addEventListener('change',()=>{const approve=card.querySelector('[data-action="approve"]');if(approve)approve.disabled=[...card.querySelectorAll('[data-check]')].some(item=>!item.checked)})));
    list.querySelectorAll('[data-action="reject"]').forEach(button=>button.addEventListener('click',async()=>{
      const comment=window.prompt('Explain what needs to change before approval:','Please attach the missing evidence or clarify the acceptance criteria.');
      if(!comment?.trim())return;
      try{await api(`/api/v1/approvals/${button.closest('[data-approval-id]').dataset.approvalId}/decision`,{method:'POST',body:JSON.stringify({decision:'rejected',comment})});notify('Changes requested and recorded in the audit log.');load()}catch(error){notify(error.message)}
    }));
  };
  switchButton?.addEventListener('click',async()=>{await fetch('/api/v1/auth/demo-login',{method:'POST',credentials:'include',headers:{'content-type':'application/json'},body:JSON.stringify({email:'daniel@cleartrack.demo'})});localStorage.setItem('cleartrack.demoEmail','daniel@cleartrack.demo');notify('Signed in as Daniel Kim.');load()});
  await load();
}
