#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int * mem; /* physical memory */
int mem_size = 0; /* memory size in pages */

struct entry{
	
		/* R & M bits used in the aging algorithm (R bit will be used in again too) */
		int R;
		int M;
	
		/* the counter used in NFU */
		unsigned char counter;
	}; //page table entry
	
struct entry page_table[21]; //The page table
/* You will use the page table above only for making page replacement decisions.
   No virtual to physical translation will take place.
   If you want to update/access R bit, for example, in aging algorithm, for page frame x 
   you do it as page_table[x].R
*/


/* **  Start of your code ******************************** */
/* TODO: Your job is to implement the following four functions */


/* ********************** NRU replacement policy ************* */ 
/* input: none */
/* output: frame of page to be replaced */

typedef struct ent
{
  int R, M,
  mem_i, /* index of entry struct in mem array */
  page, /* page number */
  num; /* 2 * R + M */
	unsigned char counter;
}ent;

void print_entry(ent * e, int n)
{
  for(int _ = 0; _ < n; ++_)
    printf("e[%d], R = %d, M = %d, mem_i = %d, page = %d, num = %d, counter = %d\n", _, e[_].R, e[_].M, e[_].mem_i, e[_].page, e[_].num, e[_].counter);
  printf("\n");
}

int cmp_num(const void * p1, const void * p2)
{
  return ((ent *)p1)->num - ((ent *)p2)->num;
}

int find(ent * e, int n) /* find number of entries with same num at left portion of array */
{
  int i = 0;
  while(i < n - 1)
  {
    if(e[i].num != e[i + 1].num)
      break;
    ++i;
  }
  return i + 1;
}

int cmp_mem_i(const void * p1, const void * p2)
{
  return ((ent *)p1)->mem_i - ((ent *)p2)->mem_i;
}

int nru()
{
  ent entry_array[mem_size];
  for(int mem_i = 0; mem_i < mem_size; ++mem_i)
  {
    int i = mem[mem_i];
    entry_array[mem_i].R = page_table[i].R;
    entry_array[mem_i].M = page_table[i].M;
    entry_array[mem_i].mem_i = mem_i;
    entry_array[mem_i].page = i;
    entry_array[mem_i].num = (page_table[i].R << 1) + page_table[i].M;
    entry_array[mem_i].counter = page_table[i].counter;
  }
  qsort(entry_array, mem_size, sizeof(ent), cmp_num);
  qsort(entry_array, find(entry_array, mem_size), sizeof(ent), cmp_mem_i); /* print_entry(entry_array, mem_size); */
  return entry_array->mem_i;
}

/* ************************************************************* */
/* input: page number referenced      
   R and M for that page
*/
/* output: NONE */
/* This function udpates info in the page table to reflect the page reference.
   This information will be used later for page replacement */
void nru_pt_update(int page, int R, int M)
{
  page_table[page].R = R;
  page_table[page].M = M;
}

int find_same_counter(ent * e, int n) /* find number of entries with same counter at left portion of array */
{
  int i = 0;
  while(i < n - 1)
  {
    if(e[i].counter != e[i + 1].counter)
      break;
    ++i;
  }
  return i + 1;
}

int cmp_counter(const void * p1, const void * p2)
{
  return ((ent *)p1)->counter - ((ent *)p2)->counter;
}

int cmp_page(const void * p1, const void * p2)
{
  return ((ent *)p1)->page - ((ent *)p2)->page;
}

/* ********************** aging replacement policy **************** */
/* input: none */
/* output: frame of page to be replaced */
int aging()
{
  ent entry_array[mem_size];
  for(int mem_i = 0; mem_i < mem_size; ++mem_i)
  {
    int i = mem[mem_i];
    entry_array[mem_i].R = page_table[i].R;
    entry_array[mem_i].M = page_table[i].M;
    entry_array[mem_i].mem_i = mem_i;
    entry_array[mem_i].page = i;
    entry_array[mem_i].counter = page_table[i].counter;
  }
  qsort(entry_array, mem_size, sizeof(ent), cmp_counter);
  qsort(entry_array, find_same_counter(entry_array, mem_size), sizeof(ent), cmp_page); /* print_entry(entry_array, mem_size); */
  return entry_array->mem_i;
}
/* ************************************************************* */
/* input: page number */
/* output: NONE */
/* This function udpates info in the page table to reflect the page reference.
   This information will be used later for page replacement */
void aging_pt_update(int page)
{
  page_table[page].R = 1;
  page_table[page].counter >>= 1;
  page_table[page].counter += page_table[page].R << 7; /* a char have 8 bits, so leftmost 1 is shift 1 by 7 */
  int n = sizeof(page_table) / sizeof(*page_table);
  for(int i = 0; i < n; ++i)
  {
    if(i != page)
    {
      page_table[i].counter >>= 1;
      page_table[i].counter += page_table[i].R << 7;
      page_table[i].R = 0;
    }
  }
}
/* **************** End of your code *************** */
/* ************************************************************* */


/* ************** Do NOT change anything below this line *** */ 
/* Input: file handle */
/* Output: none */
/* This function writes the memory content to a file */

void print_mem(FILE *file)
{
  int i;
  
  for(i = 0; i < mem_size; i++)
    fprintf(file, "%d ", mem[i]);
  
  fprintf(file, "\n");
}

/***************************************************************/
/* input: page number  */
/* output: the page frame where the paper was found or inserted */
/* This function inserts page, whose number is given in the input, in the physical memory and returns the page frame.
   If the page already exists in the memory, it will return its page fram. */

int insert(int page)
{
   unsigned i;
   
   for(i = 0; i < mem_size; i++)
     
     if(mem[i] == page)
		 return i;
     else if(!mem[i])
     {
        mem[i] = page;
		return i;
     }
     
   printf("Memory full and is not suppose to be!!\n");
   exit(1);
}


/***************************************************************/
/* Input:  page number */
/* Output: page hit or page miss */
int mem_check(int page)
{
  unsigned i;
  
  for(i = 0; i < mem_size; i++)
    if(mem[i] == page)
      return i;
    
  return -1;
  
}
/***************************************************************/
/* Input: none */
/* Ouput: 1 if memory is full, 0 otherwise */
int IsFull()
{
   unsigned i;
   
   for(i = 0; i < mem_size; i++)
     if(!mem[i])
       return 0;
   
   return 1;
}

/***************************************************************/
int main(int argc, char * argv[])
{
  int policy; /* replacement policy */
  int current;  /* current page accessed */
  FILE * fp; /* The file containing the page accesses */
  FILE * rp; /* output file */
  char filename[30]={""};
  const char * extension[] ={".nru", ".aging"};
  float num_accesses = 0.0; /* total number of page accesses */
  float page_faults = 0.0; /* total number of page faults */
  float mem_full = 0.0; /* total number of times the memory was full */
  unsigned victim = 0;  /* page to be replaced */
  int type = 0; /* The type of page access: 0: read .... 1: write */
  int frame = 0; /* page frame in physical memory */
  int i;
  
  /* Getting and checking the input from the command line */
  if(argc != 4)
  {
    printf("usage: ./paging policy size filename\n");
	printf("policy: 0 = nru  1 = aging\n");
	printf("size: physical memory size in pages (bigger than 0)\n");
	printf("filenmae: the input file\n");
	
	exit(1);
  }
  
  policy = atoi(argv[1]);
  mem_size = atoi(argv[2]);
  
  if( policy < 0 || policy > 1)
  { 
    printf("policy must be 0 or 1\n");
    exit(1);
  }
  
  if(mem_size <= 0 )
  {
    printf("Size must be a positive integer.\n");
    exit(1);
  }
  
  /* Allocate and initialize the memory */
  mem = (int *)calloc(mem_size, sizeof(int));
  if(!mem)
  {
    printf("Cannot allocate mem\n");
    exit(1);
  }
  
   /* Initialize the page table */
  for(i = 0; i < 21; i++)
  {
	  page_table[i].R =0;
	  page_table[i].M =0;
	  page_table[i].counter =0;
  }
  
  /* open the memory access file */
  fp = fopen(argv[3], "r");
  if(!fp)
  {
    printf("Cannot open file %s\n", argv[3]);
    exit(1);
  }
  
  /* Create the output file */
  strcat(filename, argv[3]);
  strcat(filename,extension[policy]);
  rp = fopen(filename, "w");
  if(!rp)
  {
    printf("Cannot create file %s\n", filename);
    exit(1);
  }
  
  /* The main loop of the program */
  while(fscanf(fp,"%d%d", &current, &type) == 2)
  { 
    num_accesses++;
	frame = mem_check(current);
    if(frame == -1)
      page_faults++;
    
    switch(policy)
    {
      case 0: //NRU
	    if(frame != -1) //The page is already in memory in page frame given
		  nru_pt_update(current, (type == 0)?1:page_table[current].R, (type == 1)?1:page_table[current].M);
		
	    else  if( IsFull()) //page not in memory and memory is full
	    { 
			mem_full++;
			victim = nru(); //victim is the page frame in physical mem that contains the page to be replaced
			mem[victim] = current;
			page_table[current].R = 1-type; //R is 1 when the page is read
			page_table[current].M = type;  // M is 1 when the page is written
			page_table[current].counter = 0; // counter can be neglected in the nru policy.
	    }
	    else //page not in memory and memory is not full
		{
			frame = insert(current);
			nru_pt_update(current, 1-type, type);
		}
	      break;
	     
      case 1: //aging  
		if(frame != -1) //The page is already in memory in page frame given
			aging_pt_update(current);
		else if( IsFull()) //page not in memory and memory is full 
	      {
			mem_full++;  
			victim = aging(); //victim is the page frame in physical mem that contains the page to be replaced
			mem[victim] = current;
			page_table[current].R = 1; //page is accessed
			aging_pt_update(current); // update all other pages
			page_table[current].counter = 128;  //128 means 1 at the leftmost
	      }
	    else //page not in memory and memory is not full
		  {
			frame = insert(current);
			aging_pt_update(current);
		  }
	      break;
	      
      default: printf("Unknown policy ... Exiting\n");
	       exit(1);
      
    }/* end switch-case */
    
    print_mem(rp); //print pages in the physical memory in the output file.

  }/* end while */
  
  fprintf(rp,"number of memory accesses = %f\n", num_accesses);
  fprintf(rp,"number of times memory was full when page fault = %f\n", mem_full);
  fprintf(rp,"number of page faults = %f\n", page_faults);
  fprintf(rp,"percentage of page faults = %f\n", page_faults/num_accesses);
  fprintf(rp,"percentage of time memory was full = %f\n", mem_full/num_accesses);
  
  /* wrap-up */
  fclose(fp);
  fclose(rp);
  free(mem);
  
  return 0;

}