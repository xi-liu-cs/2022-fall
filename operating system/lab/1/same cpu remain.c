#include <string.h>
#include "queue.h"
#include "proc.h"
#define swap(a, i, j){typeof(*a) t = a[i]; a[i] = a[j]; a[j] = t;}

void same_cpu_remain_handler(queue * q)
{
  proc * prev = front(q);
  proc * cur = q->a[(q->front + 1) % q->cap];
  int min_i = q->front;
  for(int i = 1; i < q->cur - 1 && prev->cpu_remain == cur->cpu_remain; ++i)
  {
    int prev_i = (q->front + i) % q->cap,
    cur_i = (q->front + i + 1) % q->cap;
    prev = q->a[prev_i];
    cur = q->a[cur_i];
    if(cur->pid < ((proc *)q->a[min_i])->pid)
      min_i = cur_i;
  }
  swap(q->a, q->front, min_i);
}

void print_proc(proc ** proc_array, int n)
{
    for(int i = 0; i < n; ++i)
        printf("%d ", proc_array[i]->pid);
    printf("\n");
}

int main()
{
    proc p1;
    p1.pid = 3;
    p1.cpu_remain = 0;

    proc p2;
    p2.pid = 2;
    p2.cpu_remain = 0;

    proc p3;
    p3.pid = 1;
    p3.cpu_remain = 0;

    int n = 3;
    proc * proc_array[n];
    *proc_array = &p1; proc_array[1] = &p2; proc_array[2] = &p3;

    queue * q = queue_malloc(n);
    memcpy(q->a, proc_array, n * sizeof(proc *));
    q->cur = n;
    same_cpu_remain_handler(q);
    print_proc((proc **)q->a, n);
}