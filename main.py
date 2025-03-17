from matchmaker import MHCMatchmaker

def main():
    # if no args are provided then run the matchmaker on the test data
    
    input_file = "examples/Worked_out_example.xlsx"
    output_folder = "example_results"

    matchmaker = MHCMatchmaker(output_path=output_folder)
    matchmaker.perform_matching(input_filename=input_file)

    return


if __name__ == "__main__":
    main()

