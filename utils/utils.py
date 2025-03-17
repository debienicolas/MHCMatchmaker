import logging
from typing import List
import re
import argparse
from typing import NamedTuple
logger = logging.getLogger(__name__)

# project imports
from database import get_database

"""
This module contains useful functions to manipulate alleles.
"""

def parse_allele_name(allele: str) -> List[str]:
    """
    Given an Allele, returns all allele fields.

    Arguments:
        allele: Allele to parse

    Returns:
        Allele fields
    """

    # split by * and : and return the list
    return re.split(r'[*:]', allele)


def convert_to_fasta(alleles: list[str],output_path:str) -> None:
    """
    Converts a list of alleles to a fasta file.
    Allele sequencex are retrieved form the database.

    :param alleles: list of alleles to convert to fasta format
    :param output_path: path to the output fasta file
    """
    
    seq_data = get_database()

    fasta_data = []
    for allele in alleles:
        logger.info(f"Converting {allele} to fasta format")
        try:
            fasta_data.append(f">{allele}\n{seq_data.find(allele).sequence}")
        except KeyError:
            if seq_data.find(allele).status == "abandoned":
                continue
            logger.warning(f"Allele {allele} not found in the database")

    with open(output_path, "w") as f:
        f.write("\n".join(fasta_data))

    return


class Arguments(NamedTuple):
    input_file: str
    output_folder: str

def parse_args():
    """
    Arguments parser for the command line interface.
    """

    parser = argparse.ArgumentParser(
        description = "MHC comparison",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )

    parser.add_argument("input_file",
                metavar = "input_file",
                help = "input file path",
                default="",
                type=str)
    
    parser.add_argument("output_folder",
                metavar = "output_folder",
                help = "output folder path",
                default="",
                type=str)
    
    args = parser.parse_args()

    return Arguments(args.input_file, args.output_folder)
    

                