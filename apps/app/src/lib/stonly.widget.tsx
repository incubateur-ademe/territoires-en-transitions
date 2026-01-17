'use client';

import { ENV } from '@tet/api/environmentVariables';
import { useSubscribeToUserAuthEvents } from '@tet/api/users/user-context/use-subscribe-to-user-auth-events';
import { UserWithRolesAndPermissions } from '@tet/domain/users';
import Script from 'next/script';

export default function StonlyWidget() {
  useSubscribeToUserAuthEvents({
    onSignIn: identifyStonlyUser,
  });

  if (ENV.node_env === 'development') {
    return null;
  }

  return (
    <Script id="stonly-widget">
      {`window.STONLY_WID = "1b1b2533-383c-11ef-a9d4-06cb0cb2a85e";!function(s,t,o,n,l,y,w,g,d,e){s.StonlyWidget||((d=s.StonlyWidget=function(){
d._api?d._api.apply(d,arguments):d.queue.push(arguments)}).scriptPath=n,d.apiPath=l,d.sPath=y,d.queue=[],
(g=t.createElement(o)).async=!0,(e=new XMLHttpRequest).open("GET",n+"version?v="+Date.now(),!0),
e.onreadystatechange=function(){4===e.readyState&&(g.src=n+"stonly-widget.js?v="+
(200===e.status?e.responseText:Date.now()),(w=t.getElementsByTagName(o)[0]).parentNode.insertBefore(g,w))},e.send())
}(window,document,"script","https://stonly.com/js/widget/v2/");`}
    </Script>
  );
}

const identifyStonlyUser = (user: UserWithRolesAndPermissions) => {
  if ('StonlyWidget' in window && typeof window.StonlyWidget === 'function') {
    window.StonlyWidget('identify', user.id);
  }
};
