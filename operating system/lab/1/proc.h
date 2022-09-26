#include <stdio.h>
#include <stdlib.h>
#define null NULL
int block = 128;

enum proc_state {initial, running, ready, blocked, final};
typedef struct
{
  int pid, cpu, io, arrival, 
  cpu_remain, io_remain, half_cpu, finish_time;
  enum proc_state state;
}proc;

int compare_pid(const void * p1, const void * p2)
{
  return (*(proc **)p1)->pid - (*(proc **)p2)->pid;
}

void * mal(size_t size)
{
    void * a = malloc(size);
    if(!a)
      printf("malloc error\n");
    return a;
}

void * rea(void * ptr, size_t size)
{
    void * a = realloc(ptr, size);
    if(!a)
      printf("realloc error\n");
    return a;
}

