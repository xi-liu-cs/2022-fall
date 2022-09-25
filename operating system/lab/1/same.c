#include <stdio.h>
#define swap(a, i, j){typeof(*a) t = a[i]; a[i] = a[j]; a[j] = t;}

typedef struct
{
    int pid, cpu_remain;
}proc;

void same_cpu_remain_handler(proc ** proc_array, int n)
{
    proc * prev = *proc_array,
    * cur = proc_array[1];
    int min_i = 0;
    for(int i = 1; i < n - 1 && prev->cpu_remain == cur->cpu_remain; ++i)
    {
        prev = proc_array[i];
        cur = proc_array[i + 1];
        if(cur->pid < proc_array[min_i]->pid)
            min_i = i + 1;
    }
    swap(proc_array, 0, min_i);
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

    same_cpu_remain_handler(proc_array, n);
    print_proc(proc_array, n);
}