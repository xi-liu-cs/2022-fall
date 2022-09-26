#include "queue link.h"

int main()
{
    int a[] = {0, 1, 2, 3, 4, 5, 6, 7, 8}, n = sizeof(a) / sizeof(*a);
    queue_link * q = queue_link_malloc();
    for(int i = 0; i < 3; ++i)
    {
        for(int j = 0; j < n; ++j)
        {
            proc * p = (proc *)mal(sizeof(proc));
            p->pid = a[j];
            queue_link_push(q, p);
            print_queue_link(q);
            printf("front = %d, back = %d\n", q->front->p->pid, q->back->p->pid);
        }
    }
    queue_link * q2 = sort_queue_link(q, compare_pid);
    print_queue_link(q2);
    free(q);
    q = q2;
    printf("\n");
    for(int i = 0; i < 3; ++i)
    {
        for(int j = 0; j < n; ++j)
        {
            proc * p = (proc *)mal(sizeof(proc));
            p->pid = a[j];
            queue_link_erase(q, p);
            print_queue_link(q);
            if(j != n - 1)
                printf("front = %d, back = %d\n", q->front->p->pid, q->back->p->pid);
        }
    }
    queue_link * q3 = queue_link_malloc();
    for(int i = 0; i < n; ++i)
    {
        proc * p = (proc *)mal(sizeof(proc));
        p->pid = a[n - i - 1];
        queue_link_push(q3, p);
        print_queue_link(q3);
        printf("front = %d, back = %d\n", q3->front->p->pid, q3->back->p->pid);
    }
    queue_link_combine(q3, q);
    print_queue_link(q3);
}