from tinydb import TinyDB, Query, where
from tinydb.storages import JSONStorage
from tinydb.middlewares import CachingMiddleware
import re
import os
import json
from dataclasses import dataclass, field
from typing import List, Optional, Tuple, Dict
from loguru import logger as logger

@dataclass
class Allele:
    """
    This dataclass represents an allele with its attributes
    """
    accession: str
    sequence: str = ""
    aligned_seq: str = ""
    asa: List[float] = field(default_factory=list) # empty list if not calculated
    rsa: List[float] = field(default_factory=list) # empty list if not calculated
    status: Optional[str] = "Public"
    secondary_names: List[str] = field(default_factory=list)
    allele_class: Optional[str] = None
    locus: Optional[str] = None
    aligned_rsa: Optional[List[float]] = None
    aligned_asa: Optional[List[float]] = None
    start_pos : Optional[int] = None    # 1-indexed positionof the sequence
    eplets: Optional[List[str]] = None
    netsurfp_rsa_unaligned: Optional[List[float]] = None

#class TinyDB:

class TinyDBDatabase():
    """
    Implementation of the Database interface using TinyDB.
    TinyDB is a lightweight document-oriented database that stores data in JSON files.
    """
    
    def __init__(self, db_path="data/alleles_db.json"):
        """Initialize the TinyDB database with caching for better performance"""
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self.db = TinyDB(db_path, storage=CachingMiddleware(JSONStorage))
        self.alleles = self.db.table('alleles')
        self._setup_db(db_path=db_path)
        #self.db = TinyDB(db_path, storage=CachingMiddleware(JSONStorage))
        
    def _setup_db(self, db_path):
        """Set up the database if it's empty by importing data from original_db.json"""
        if len(self.alleles) == 0:
            try:
                with open("data/original_db.json", "r") as f:
                    original_data = json.load(f)
                
                # Convert the data format for TinyDB
                documents = []
                for allele_id, allele_data in original_data.items():
                    doc = allele_data.copy() if isinstance(allele_data, dict) else allele_data.__dict__.copy()
                    doc['_id'] = allele_id  # Store the ID as a field
                    documents.append(doc)
                
                # Insert all documents
                self.alleles.insert_multiple(documents)
                logger.info(f"Imported {len(documents)} alleles into TinyDB")
                # save the db
                self.db.close()

                self.db = TinyDB(db_path, storage=CachingMiddleware(JSONStorage))

            except (FileNotFoundError, json.JSONDecodeError) as e:
                logger.error(f"Error loading original database: {e}")

    
    def find(self, allele_id: str) -> Allele:
        """Find an allele by its ID"""
        result = self.alleles.get(where('_id') == allele_id)
        if result:
            # Create a copy of the result and remove the _id field
            allele_data = result.copy()
            allele_data.pop('_id', None)
            return Allele(**allele_data)
        return None
    
    def find_dict(self, allele_id: str) -> Dict[str, str]:
        """Find an allele by its ID and return as a dictionary"""
        return self.alleles.get(where('_id') == allele_id)
    
    def specific_find(self, attribute, value):
        """Find an allele by a specific attribute and value"""
        result = self.alleles.get(where(attribute) == value)
        return result
    
    def str_in_allele(self, s: str):
        """Find alleles that contain a specific string in their ID"""
        # TinyDB doesn't have a direct regex search, so we'll filter manually
        results = []
        for doc in self.alleles:
            if '_id' in doc and re.search(re.escape(s), doc.get('_id', '')):
                results.append(doc)
        return results
    
    def get_all_ids(self) -> List[str]:
        """Get all allele IDs in the database"""
        return [doc.get('_id', '') for doc in self.alleles]
    
    def get_all_ids_filtered(self) -> List[str]:
        """Get filtered allele IDs for all classes"""
        all_alleles = []
        for cls in ["I", "IIDQA", "IIDQB", "IIDRA", "IIDRB"]:
            all_alleles.extend(self.get_all_alleles_for_class(cls))
        return all_alleles
    
    def get_all_alleles_for_class(self, allele_class: str) -> List[str]:
        """Get all allele IDs for a specific class with filtering"""
        Allele = Query()
        
        if allele_class == "I":
            # Filter for class I alleles that aren't abandoned and have valid sequences
            results = self.alleles.search(
                (Allele.allele_class == allele_class) & 
                (Allele.status != "abandoned") & 
                (Allele.sequence != "X") & 
                (Allele.sequence != "")
            )
            # Additional filter for not containing "/N" in _id
            results = [doc for doc in results if "/N" not in doc.get('_id', '')]
            
        elif allele_class in ["IIDQA", "IIDQB", "IIDRA", "IIDRB"]:
            locus_prefix = allele_class[2:]  # Extract DQA, DQB, DRA, or DRB
            
            # Filter for class II alleles with specific locus
            results = self.alleles.search(
                (Allele.allele_class == "II") & 
                (Allele.status != "abandoned") & 
                (Allele.sequence != "X") & 
                (Allele.sequence != "")
            )
            
            # Additional filter for locus and not containing "/N" in _id
            results = [doc for doc in results 
                      if doc.get('locus', '').startswith(locus_prefix) 
                      and "/N" not in doc.get('_id', '')]
        else:
            raise ValueError(f"Invalid allele_class: {allele_class}")
        
        return [doc.get('_id', '') for doc in results]
    
    def get_consensus_seq(self, allele_class: str) -> str:
        """Get consensus sequence for a specific class"""
        consensus_paths = {
            "I": "data/alignment/consensus_I.fasta",
            "IIDQA": "data/alignment/consensus_DQA.fasta",
            "IIDQB": "data/alignment/consensus_DQB.fasta",
            "IIDRA": "data/alignment/consensus_DRA.fasta",
            "IIDRB": "data/alignment/consensus_DRB.fasta"
        }
        
        try:
            with open(consensus_paths[allele_class], "r") as f:
                for line in f:
                    if line.startswith(">"):
                        continue
                    else:
                        consensus_seq = line.strip()
            return consensus_seq
        except KeyError:
            raise ValueError(f"Invalid allele_class: {allele_class}")
        except FileNotFoundError:
            raise FileNotFoundError(f"Consensus file for {allele_class} not found")
    
    def get_consensus_distribution(self, allele_class: str) -> List[float]:
        """Get consensus distribution for a specific class"""
        distribution_paths = {
            "I": "data/consensus_distribution_I.csv",
            "IIDQA": "data/consensus_distribution_DQA.csv",
            "IIDQB": "data/consensus_distribution_DQB.csv",
            "IIDRA": "data/consensus_distribution_DRA.csv",
            "IIDRB": "data/consensus_distribution_DRB.csv"
        }
        
        distribution = []
        try:
            with open(distribution_paths[allele_class], "r") as f:
                for line in f:
                    position, count = line.split(',')
                    distribution.append(count)
            return distribution
        except KeyError:
            raise ValueError(f"Invalid allele_class: {allele_class}")
        except FileNotFoundError:
            raise FileNotFoundError(f"Distribution file for {allele_class} not found")
    
    def get_eplet_dict(self, allele_class: str) -> Dict[int, str]:
        """Get eplet dictionary for a specific class"""
        eplet_paths = {
            "IIDRB": "data/eplets/eplets_DRB.json",
            "IIDQ": "data/eplets/eplets_DQ.json",
            "I": "data/eplets/eplets_I.json"
        }
        
        if allele_class in eplet_paths:
            try:
                with open(eplet_paths[allele_class], "r") as f:
                    eplet_dict = json.load(f)
                return eplet_dict
            except FileNotFoundError:
                logger.warning(f"Eplet file for {allele_class} not found")
                return None
        else:
            return None
    
    def get_all_acc_allele_per_species(self, species: str) -> Tuple[List[str], List[str]]:
        """Get all accessions and allele names for a specific species"""
        Allele = Query()
        
        if species == "hla":
            species = "HLA"
            results = self.alleles.search(lambda doc: species in doc.get('accession', ''))
        elif species == "sla":
            species = "SLA"
            results = self.alleles.search(lambda doc: species in doc.get('accession', ''))
        elif species == "mamu":
            species = "Mamu"
            results = self.alleles.search(lambda doc: "Mamu" in doc.get('_id', ''))
        elif species == "mafa":
            species = "Mafa"
            results = self.alleles.search(lambda doc: "Mafa" in doc.get('_id', ''))
        else:
            raise ValueError(f"Invalid species: {species}")
        
        accessions = [doc.get('accession', '') for doc in results]
        allele_names = [doc.get('_id', '') for doc in results]
        return accessions, allele_names
    
    def get_allele_class(self, allele_id: str) -> str:
        """Get the class of a specific allele"""
        result = self.alleles.get(where('_id') == allele_id)
        if not result:
            raise ValueError(f"Allele {allele_id} not found")
        
        cls = result.get('allele_class')
        if cls == "I":
            return "I"
        else:
            assert cls == "II", f"Invalid allele class: {cls}"
            locus = result.get('locus', '')
            if "DQA" in locus:
                return "IIDQA"
            elif "DQB" in locus:
                return "IIDQB"
            elif "DRA" in locus:
                return "IIDRA"
            elif "DRB" in locus:
                return "IIDRB"
            else:
                raise ValueError(f"Invalid locus: {locus}")
    
    def update_eplet_presence(self, allele_id: str, eplet_ids: List[str]):
        """Update the eplet presence for a specific allele"""
        self.alleles.update({'eplets': eplet_ids}, where('_id') == allele_id)
    
    def bson_to_dataclass(self, bson_data) -> Allele:
        """Convert BSON data to an Allele dataclass instance"""
        data = bson_data.copy()
        data.pop("_id", None)
        return Allele(**data)



def get_database():
    """
    Return a database object:
    Either MongoDB, TinyDB, or localDB depending on the set environment variable
    """
    return TinyDBDatabase()