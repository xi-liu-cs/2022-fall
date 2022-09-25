#include <string.h>
#include "queue.h"
#include "proc.h"

void * mal(size_t size)
{
    void * a = malloc(size);
    if(!a)
      printf("malloc error\n");
    return a;
}

proc ** queue_to_proc_array(queue * q)
{
  proc ** a = (proc **)mal(q->cur * sizeof(proc *));
  for(int i = 0; i < q->cur; ++i)
    a[i] = q->a[(q->front + i) % q->cap];
  return a;
}

queue * proc_array_to_queue(proc ** p, int n)
{
  queue * q = (queue *)mal(sizeof(queue));
  size_t sz = n * sizeof(proc *);
  q->a = mal(sz);
  memcpy(q->a, p, sz);
  q->front = 0;
  q->back = n - 1;
  q->cap = n;
  q->cur = n;
  return q;
}

int compare_pid(const void * p1, const void * p2)
{
  return (*(proc **)p1)->pid - (*(proc **)p2)->pid;
}

int main()
{
    int a[] = {8, 7, 6, 5, 4, 3, 2, 1}, n = sizeof(a) / sizeof(*a);
    queue * q = queue_malloc(1);
    for(int i = 0; i < 3; ++i)
    {
        for(int j = 0; j < n; ++j)
        {
            push(q, a + j);
            print(q);
            printf("front = %d, back = %d\n", *(int *)front(q), *(int *)back(q));
        }
    }
    proc ** proc_array2 = queue_to_proc_array(q);
    int proc_array2_len = q->cur;
    qsort(proc_array2, proc_array2_len, sizeof(proc *), compare_pid);
    free(q);
    q = proc_array_to_queue(proc_array2, proc_array2_len);
    printf("q: ");
    print(q);
}