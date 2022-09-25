enum proc_state {initial, running, ready, blocked, final};
typedef struct
{
  int pid, cpu, io, arrival, 
  cpu_remain, io_remain, half_cpu, finish_time;
  enum proc_state state;
}proc;