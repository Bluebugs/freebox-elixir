var ecore_event_job_type = 0;

function ecore_job_add(func_handler, func_free, data)
{
   function _ecore_job_event_handler(data, type, ev)
     {
        ev.funch(ev.data);
        return 1;
     }
   function _ecore_job_event_free(data, ev)
     {
	if (ev.funcf)
          ev.funcf(ev.data);
     }

   var job;

   if (!func_handler) return null;
   if (!ecore_event_job_type)
     {
        ecore_event_job_type = ecore_event_type_new();
        ecore_event_handler_add(ecore_event_job_type, _ecore_job_event_handler, null);
     }
   job = new Object();

   job.event = ecore_event_add(ecore_event_job_type, job, _ecore_job_event_free, null);
   if (!job.event)
     return null;

   job.funch = func_handler;
   job.funcf = func_free;
   job.data = data;
   return job;
}

function ecore_job_del(job)
{
   var data;

   data = job.data;

   if (job.event === undefined)
     return null;

   ecore_event_del(job.event);

   return data;
}

true;

